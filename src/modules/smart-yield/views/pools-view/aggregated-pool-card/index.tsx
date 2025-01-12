import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import { formatPercent, formatToken, formatUSD } from 'web3/utils';

import Icon from 'components/custom/icon';
import StatusTag from 'components/custom/status-tag';
import { Tabs as ElasticTabs } from 'components/custom/tabs';
import { Hint, Text } from 'components/custom/typography';
import { TokenMeta, convertTokenInUSD, useKnownTokens } from 'components/providers/known-tokens-provider';
import { FCx } from 'components/types.tx';
import { useRewardPools } from 'modules/smart-yield/providers/reward-pools-provider';
import { useWallet } from 'wallets/wallet';

import s from './s.module.scss';

const AggregatedPoolCard: FCx = props => {
  const knownTokensCtx = useKnownTokens();
  const walletCtx = useWallet();
  const rewardPoolsCtx = useRewardPools();

  const [activeTab, setActiveTab] = useState('pool');

  const { pools: rewardPools } = rewardPoolsCtx;

  const rewardTokens = rewardPools.reduce((set, pool) => {
    Array.from(pool.rewardTokens.values()).forEach(rewardToken => {
      set.add(rewardToken);
    });
    return set;
  }, new Set<TokenMeta>());

  const totalDailyRewards = rewardPools.reduce((map, pool) => {
    Array.from(pool.rewardTokens).forEach(([rewardTokenAddress, rewardToken]) => {
      const prevDailyReward = map.get(rewardTokenAddress) ?? BigNumber.ZERO;
      const dailyReward = pool.rewardPool.getDailyRewardFor(rewardTokenAddress)?.unscaleBy(rewardToken.decimals);

      map.set(rewardTokenAddress, prevDailyReward.plus(dailyReward ?? BigNumber.ZERO));
    });

    return map;
  }, new Map<string, BigNumber>());

  const totalPoolSizeInUSD = BigNumber.sumEach(rewardPools, ({ rewardPool, smartYield }) => {
    const tokenMeta = knownTokensCtx.getTokenByAddress(smartYield.address);
    return tokenMeta
      ? convertTokenInUSD(rewardPool.poolSize?.unscaleBy(tokenMeta.decimals), tokenMeta.symbol)
      : undefined;
  });

  const totalPotentialRewards = rewardPools.reduce((map, pool) => {
    Array.from(pool.rewardTokens).forEach(([rewardTokenAddress, rewardToken]) => {
      const prevReward = map.get(rewardTokenAddress) ?? BigNumber.ZERO;
      const dailyReward = pool.rewardPool.getMyDailyRewardFor(rewardTokenAddress)?.unscaleBy(rewardToken.decimals);

      map.set(rewardTokenAddress, prevReward.plus(dailyReward ?? BigNumber.ZERO));
    });

    return map;
  }, new Map<string, BigNumber>());

  const totalStakedInUSD = BigNumber.sumEach(rewardPools, ({ rewardPool, smartYield, rewardTokens }) => {
    const value = rewardPool.getBalanceFor(walletCtx.account!)?.unscaleBy(smartYield.decimals);
    return knownTokensCtx.convertTokenInUSD(value, smartYield.symbol!);
  });

  const aggregatedAPR = BigNumber.ZERO;
  // const aggregatedAPR = BigNumber.sumEach(yfPoolsCtx.syPools, ({ rewardContract, poolContract }) => {
  //   if (!rewardContract.dailyReward || !BondToken.price) {
  //     return undefined;
  //   }
  //
  //   const yearlyReward = rewardContract.dailyReward
  //     .unscaleBy(BondToken.decimals)
  //     ?.multipliedBy(BondToken.price)
  //     .multipliedBy(365);
  //
  //   if (!yearlyReward) {
  //     return undefined;
  //   }
  //
  //   const tokenMeta = knownTokensCtx.getTokenByAddress(poolContract.address);
  //
  //   if (!tokenMeta || !rewardContract.poolSize) {
  //     return undefined;
  //   }
  //
  //   const poolBalance = knownTokensCtx.convertTokenInUSD(
  //     rewardContract.poolSize.unscaleBy(poolContract.decimals),
  //     tokenMeta.symbol,
  //   );
  //
  //   if (!poolBalance) {
  //     return undefined;
  //   }
  //
  //   return yearlyReward.dividedBy(poolBalance);
  // }); /// ???

  return (
    <div className="card flex flow-row">
      <div className={cn(s.cardHeader, 'flex align-center justify-space-between p-24')}>
        <div className="flex align-center">
          <StatusTag
            text="NEW"
            color="blue"
            style={{ minWidth: 49, height: 24, padding: '4px 8px' }}
            className="mr-16"
          />
          <Text type="p1" weight="semibold" color="primary">
            SMART Yield Pools
          </Text>
        </div>
      </div>
      <div className="flex flow-row flex-grow ph-24 pb-24">
        <ElasticTabs
          tabs={[
            { id: 'pool', children: 'Pool statistics' },
            { id: 'my', children: 'My statistics', disabled: !walletCtx.isActive },
          ]}
          activeKey={activeTab}
          onClick={setActiveTab}
          variation="elastic"
          className="mb-24"
          style={{
            width: '100%',
            height: 40,
          }}
        />

        {activeTab === 'pool' && (
          <div className="flex flow-row">
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                APR
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatPercent(aggregatedAPR) ?? '-'}
              </Text>
            </div>
            {Array.from(rewardTokens.values()).map(rewardToken => (
              <div className="flex align-center justify-space-between mb-24">
                <Hint text={`This number shows the $${rewardToken.symbol} token rewards distributed per day.`}>
                  <Text type="small" weight="semibold" color="secondary">
                    {rewardToken.symbol} daily reward
                  </Text>
                </Hint>
                <div className="flex align-center">
                  <Icon name={rewardToken.icon!} width={16} height={16} className="mr-8" />
                  <Text type="p1" weight="semibold" color="primary">
                    {formatToken(totalDailyRewards.get(rewardToken.address)) ?? '-'}
                  </Text>
                </div>
              </div>
            ))}
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                Pool balance
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatUSD(totalPoolSizeInUSD) ?? '-'}
              </Text>
            </div>
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                Effective pool balance
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatUSD(totalPoolSizeInUSD) ?? '-'}
              </Text>
            </div>
          </div>
        )}

        {activeTab === 'my' && walletCtx.isActive && (
          <div className="flex flow-row">
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                APR
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatPercent(aggregatedAPR) ?? '-'}
              </Text>
            </div>
            {Array.from(rewardTokens.values()).map(rewardToken => (
              <div className="flex align-center justify-space-between mb-24">
                <Text type="small" weight="semibold" color="secondary">
                  My potential {rewardToken.symbol} reward
                </Text>
                <div className="flex align-center">
                  <Icon name={rewardToken.icon!} width={16} height={16} className="mr-8" />
                  <Text type="p1" weight="semibold" color="primary">
                    {formatToken(totalPotentialRewards.get(rewardToken.address)) ?? '-'}
                  </Text>
                </div>
              </div>
            ))}
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                My pool balance
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatUSD(totalStakedInUSD) ?? '-'}
              </Text>
            </div>
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="semibold" color="secondary">
                My effective pool balance
              </Text>
              <Text type="p1" weight="semibold" color="primary">
                {formatUSD(totalStakedInUSD) ?? '-'}
              </Text>
            </div>
          </div>
        )}

        <div className="flex align-center justify-space-between col-gap-16 mt-auto">
          <Link to={`/smart-yield/pools`} className="button-primary flex-grow">
            View pools
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AggregatedPoolCard;
