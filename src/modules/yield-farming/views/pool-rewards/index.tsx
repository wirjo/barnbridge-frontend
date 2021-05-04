import React, { FC, useState } from 'react';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import Erc20Contract from 'web3/contracts/erc20Contract';
import { formatToken } from 'web3/utils';

import Icon from 'components/custom/icon';
import { Hint, Text } from 'components/custom/typography';
import { BondToken } from 'components/providers/known-tokens-provider';
import PoolHarvestModal from 'modules/yield-farming/components/pool-harvest-modal';
import { useYFPools } from 'modules/yield-farming/providers/pools-provider';
import { useWallet } from 'wallets/wallet';

import s from 'modules/yield-farming/views/pool-rewards/s.module.scss';

const PoolRewards: FC = () => {
  const walletCtx = useWallet();
  const yfPoolsCtx = useYFPools();

  const [harvestModalVisible, showHarvestModal] = useState(false);

  const bondContract = BondToken.contract as Erc20Contract;

  const totalToClaim = yfPoolsCtx.pools.reduce((sum: BigNumber | undefined, { contract }) => {
    return (sum ?? BigNumber.ZERO).plus(contract.toClaim ?? BigNumber.ZERO);
  }, undefined);

  const totalPotentialReward = yfPoolsCtx.pools.reduce((sum: BigNumber | undefined, { contract }) => {
    if (contract.isPoolEnded !== false) {
      return sum;
    }

    return (sum ?? BigNumber.ZERO).plus(contract.potentialReward ?? BigNumber.ZERO);
  }, undefined);

  return (
    <div className={cn(s.component, 'flex flow-row pv-24 ph-64')}>
      <Text type="lb2" weight="semibold" color="red" className="mb-16">
        My Rewards
      </Text>

      <div className="flex col-gap-24">
        <div className="flex flow-row">
          <Text type="p2" color="secondary" className="mb-4">
            Current reward
          </Text>
          <div className="flex col-gap-16 align-center">
            <Text type="h3" weight="bold" color="primary">
              {formatToken(totalToClaim?.unscaleBy(BondToken.decimals))}
            </Text>
            <Icon name={BondToken.icon!} />
            {walletCtx.isActive && (
              <button
                type="button"
                className="button-text"
                disabled={!totalToClaim?.gt(BigNumber.ZERO)}
                onClick={() => showHarvestModal(true)}>
                Claim
              </button>
            )}
          </div>
        </div>
        <div className="v-divider" />
        <div className="flex flow-row">
          <Text type="p2" color="secondary" className="mb-4">
            Bond Balance
          </Text>
          <div className="flex col-gap-16 align-center">
            <Text type="h3" weight="bold" color="primary">
              {formatToken(bondContract.balance?.unscaleBy(BondToken.decimals)) ?? '-'}
            </Text>
            <Icon name={BondToken.icon!} />
          </div>
        </div>
        <div className="v-divider" />
        <div className="flex flow-row">
          <Hint text="This number shows the $BOND rewards you would potentially be able to harvest this epoch, but is subject to change - in case more users deposit, or you withdraw some of your stake.">
            <Text type="p2" color="secondary" className="mb-4">
              Potential reward this epoch
            </Text>
          </Hint>
          <div className="flex col-gap-8 align-center">
            <Text type="h3" weight="bold" color="primary">
              {formatToken(totalPotentialReward?.unscaleBy(BondToken.decimals)) ?? '-'}
            </Text>
            <Icon name={BondToken.icon!} />
          </div>
        </div>
      </div>

      {harvestModalVisible && <PoolHarvestModal onCancel={() => showHarvestModal(false)} />}
    </div>
  );
};

export default PoolRewards;