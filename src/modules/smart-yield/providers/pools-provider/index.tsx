import React from 'react';
import { useHistory } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import Erc20Contract from 'web3/erc20Contract';
import { ZERO_BIG_NUMBER, getEtherscanTxUrl } from 'web3/utils';
import Web3Contract from 'web3/web3Contract';

import { BondToken } from 'components/providers/known-tokens-provider';
import { useReload } from 'hooks/useReload';
import { APISYPool, Markets, Pools, SYMarketMeta, SYPoolMeta, fetchSYPools } from 'modules/smart-yield/api';
import TxStatusModal from 'modules/smart-yield/components/tx-status-modal';
import SYRewardPoolContract from 'modules/smart-yield/contracts/syRewardPoolContract';
import SYSeniorBondContract from 'modules/smart-yield/contracts/sySeniorBondContract';
import SYSmartYieldContract from 'modules/smart-yield/contracts/sySmartYieldContract';
import { useWallet } from 'wallets/wallet';

export type PoolsSYPool = APISYPool & {
  meta?: SYPoolMeta;
  market?: SYMarketMeta;
  contracts: {
    smartYield?: SYSmartYieldContract;
    underlying?: Erc20Contract;
    rewardPool?: SYRewardPoolContract;
  };
  rewardAPR?: BigNumber;
};

type State = {
  loading: boolean;
  pools: PoolsSYPool[];
};

const InitialState: State = {
  loading: false,
  pools: [],
};

type ContextType = State & {
  redeemBond: (smartYieldAddress: string, sBondId: number, gasPrice: number) => Promise<void>;
  redeemJuniorBond: (smartYieldAddress: string, jBondId: number, gasPrice: number) => Promise<void>;
  transferFrom: (seniorBondAddress: string, address: string, sBondId: number, gasPrice: number) => Promise<void>;
};

const Context = React.createContext<ContextType>({
  ...InitialState,
  redeemBond: () => Promise.reject(),
  redeemJuniorBond: () => Promise.reject(),
  transferFrom: () => Promise.reject(),
});

type StatusModal = {
  visible: boolean;
  type?: 'redeem' | 'transfer' | 'redeemJunior';
  state?: 'progress' | 'success' | 'failure';
  txHash?: string;
};

export function usePools(): ContextType {
  return React.useContext(Context);
}

const PoolsProvider: React.FC = props => {
  const { children } = props;

  const history = useHistory();
  const wallet = useWallet();
  const [reload, version] = useReload();
  const [state, setState] = React.useState<State>(InitialState);

  const [statusModal, setStatusModal] = React.useState<StatusModal>({
    visible: false,
    type: undefined,
    state: undefined,
    txHash: undefined,
  });

  React.useEffect(() => {
    setState(prevState => ({
      ...prevState,
      loading: true,
      pools: [],
    }));

    (async () => {
      try {
        const pools = await fetchSYPools();

        setState(prevState => ({
          ...prevState,
          loading: false,
          pools: pools.map(pool => {
            const smartYield = new SYSmartYieldContract(pool.smartYieldAddress);
            smartYield.on(Web3Contract.UPDATE_DATA, reload);
            const underlying = new Erc20Contract([], pool.underlyingAddress);
            underlying.on(Web3Contract.UPDATE_DATA, reload);

            smartYield.loadCommon();
            underlying.loadCommon();

            let rewardPool;
            if (pool.rewardPoolAddress) {
              rewardPool = new SYRewardPoolContract(pool.rewardPoolAddress);
              rewardPool.on(Web3Contract.UPDATE_DATA, reload);
              rewardPool.loadCommon();
            }

            return {
              ...pool,
              meta: Pools.get(pool.underlyingSymbol),
              market: Markets.get(pool.protocolId),
              contracts: {
                smartYield,
                underlying,
                rewardPool,
              },
            };
          }),
        }));
      } catch {
        setState(prevState => ({
          ...prevState,
          loading: false,
        }));
      }
    })();
  }, []);

  React.useEffect(() => {
    state.pools.forEach(pool => {
      pool.contracts.smartYield?.setProvider(wallet.provider);
      pool.contracts.smartYield?.setAccount(wallet.account);

      pool.contracts.underlying?.setProvider(wallet.provider);
      pool.contracts.underlying?.setAccount(wallet.account);
      pool.contracts.underlying?.loadBalance();

      pool.contracts.rewardPool?.setProvider(wallet.provider);
      pool.contracts.rewardPool?.setAccount(wallet.account);
    });
  }, [state.pools, wallet.account]);

  // React.useEffect(() => { /// ???
  //   state.pools.forEach(pool => {
  //     const { smartYield, rewardPool } = pool.contracts;
  //
  //     if (!smartYield || !rewardPool) {
  //       return;
  //     }
  //
  //     const { poolSize, dailyReward } = rewardPool;
  //
  //     if (poolSize && dailyReward) {
  //       const bondPrice = BondToken.price ?? 1;
  //       const jTokenPrice = smartYield.price ?? 1;
  //
  //       const yearlyReward = dailyReward
  //         .dividedBy(10 ** BondToken.decimals)
  //         .multipliedBy(bondPrice)
  //         .multipliedBy(365);
  //       const poolBalance = poolSize
  //         .dividedBy(10 ** (smartYield.decimals ?? 0))
  //         .multipliedBy(jTokenPrice)
  //         .multipliedBy(1);
  //
  //       if (poolBalance.isEqualTo(ZERO_BIG_NUMBER)) {
  //         return ZERO_BIG_NUMBER;
  //       }
  //
  //       pool.rewardAPR = yearlyReward.dividedBy(poolBalance);
  //       reload();
  //     }
  //   });
  // }, [state.pools, BondToken.price, version]);

  const redeemBond = React.useCallback(
    (smartYieldAddress: string, sBondId: number, gasPrice: number) => {
      const smartYieldContract = new SYSmartYieldContract(smartYieldAddress);
      smartYieldContract.setProvider(wallet.provider);
      smartYieldContract.setAccount(wallet.account);

      smartYieldContract
        .on('tx:hash', (txHash: string) => {
          setStatusModal(prevState => ({
            ...prevState,
            visible: true,
            type: 'redeem',
            state: 'progress',
            txHash,
          }));
        })
        .on('tx:success', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'success',
          }));
        })
        .on('tx:fail', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'failure',
          }));
        });

      return smartYieldContract.redeemBondSend(sBondId, gasPrice);
    },
    [wallet.account, wallet.provider],
  );

  const redeemJuniorBond = React.useCallback(
    (smartYieldAddress: string, jBondId: number, gasPrice: number) => {
      const smartYieldContract = new SYSmartYieldContract(smartYieldAddress);
      smartYieldContract.setProvider(wallet.provider);
      smartYieldContract.setAccount(wallet.account);

      smartYieldContract
        .on('tx:hash', (txHash: string) => {
          setStatusModal(prevState => ({
            ...prevState,
            visible: true,
            type: 'redeemJunior',
            state: 'progress',
            txHash,
          }));
        })
        .on('tx:success', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'success',
          }));
        })
        .on('tx:fail', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'failure',
          }));
        });

      return smartYieldContract.redeemJuniorBondSend(jBondId, gasPrice);
    },
    [wallet.account, wallet.provider],
  );

  const transferFrom = React.useCallback(
    (seniorBondAddress: string, address: string, sBondId: number, gasPrice: number) => {
      const seniorBondContract = new SYSeniorBondContract(seniorBondAddress);
      seniorBondContract.setProvider(wallet.provider);
      seniorBondContract.setAccount(wallet.account);

      seniorBondContract
        .on('tx:hash', (txHash: string) => {
          setStatusModal(prevState => ({
            ...prevState,
            visible: true,
            type: 'transfer',
            state: 'progress',
            txHash,
          }));
        })
        .on('tx:success', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'success',
          }));
        })
        .on('tx:fail', () => {
          setStatusModal(prevState => ({
            ...prevState,
            state: 'failure',
          }));
        });

      return seniorBondContract.transferFromSend(wallet.account!, address, sBondId, gasPrice);
    },
    [wallet.account, wallet.provider],
  );

  function handleStatusModalCancel() {
    setStatusModal(prevState => ({
      ...prevState,
      visible: false,
      type: undefined,
      state: undefined,
      txHash: undefined,
    }));
  }

  function handleTxSuccess() {
    setStatusModal(prevState => ({
      ...prevState,
      visible: false,
      type: undefined,
      state: undefined,
      txHash: undefined,
    }));

    history.push({
      pathname: `/smart-yield/portfolio/senior`,
    });
  }

  const value = React.useMemo<ContextType>(() => {
    return {
      ...state,
      redeemBond,
      transferFrom,
      redeemJuniorBond,
    };
  }, [state, version]);

  return (
    <>
      <Context.Provider value={value}>{children}</Context.Provider>
      {statusModal.visible && (
        <TxStatusModal
          type={statusModal.type}
          state={statusModal.state}
          txLink={statusModal.txHash && getEtherscanTxUrl(statusModal.txHash)}
          onCancel={handleStatusModalCancel}
          onSuccessClick={handleTxSuccess}
        />
      )}
    </>
  );
};

export default PoolsProvider;
