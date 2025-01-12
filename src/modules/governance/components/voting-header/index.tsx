import React from 'react';
import { Spin } from 'antd';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import Erc20Contract from 'web3/erc20Contract';
import { formatBONDValue, formatBigValue, isSmallBONDValue } from 'web3/utils';

import Button from 'components/antd/button';
import Divider from 'components/antd/divider';
import Skeleton from 'components/antd/skeleton';
import Tooltip from 'components/antd/tooltip';
import ExternalLink from 'components/custom/externalLink';
import Grid from 'components/custom/grid';
import Icon from 'components/custom/icon';
import { Hint, Text } from 'components/custom/typography';
import { BondToken } from 'components/providers/known-tokens-provider';
import { UseLeftTime } from 'hooks/useLeftTime';
import useMergeState from 'hooks/useMergeState';
import { useDAO } from 'modules/governance/components/dao-provider';

import VotingDetailedModal from '../voting-detailed-modal';

import { getFormattedDuration, inRange } from 'utils';

import s from './s.module.scss';

type VotingHeaderState = {
  claiming: boolean;
  showDetailedView: boolean;
};

const InitialState: VotingHeaderState = {
  claiming: false,
  showDetailedView: false,
};

const VotingHeader: React.FC = () => {
  const daoCtx = useDAO();

  const [state, setState] = useMergeState<VotingHeaderState>(InitialState);

  const { claimValue } = daoCtx.daoReward;
  const bondBalance = (BondToken.contract as Erc20Contract).balance?.unscaleBy(BondToken.decimals);
  const { votingPower, userLockedUntil, multiplier = 1 } = daoCtx.daoBarn;

  const loadedUserLockedUntil = (userLockedUntil ?? Date.now()) - Date.now();

  function handleLeftTimeEnd() {
    daoCtx.daoBarn.reload();
  }

  function handleClaim() {
    setState({ claiming: true });

    daoCtx.daoReward.actions
      .claim()
      .catch(Error)
      .then(() => {
        daoCtx.daoReward.reload();
        (BondToken.contract as Erc20Contract).loadBalance().catch(Error);
        setState({ claiming: false });
      });
  }

  return (
    <div className={cn(s.component, 'pv-24 ph-64 sm-ph-16')}>
      <Text type="lb2" weight="semibold" color="red" className="mb-16">
        My Voting Power
      </Text>
      <Grid flow="col" gap={24} className={s.items}>
        <Grid flow="row" gap={4}>
          <Text type="p2" color="secondary">
            Current reward
          </Text>
          <Grid flow="col" gap={16} align="center">
            <Tooltip title={<Text type="p2">{formatBigValue(claimValue, BondToken.decimals)}</Text>}>
              <Skeleton loading={claimValue === undefined}>
                <Text type="h3" weight="bold" color="primary">
                  {isSmallBONDValue(claimValue) && '> '}
                  {formatBONDValue(claimValue)}
                </Text>
              </Skeleton>
            </Tooltip>
            <Icon name="static/token-bond" />
            <Button type="light" disabled={claimValue?.isZero()} onClick={handleClaim}>
              {!state.claiming ? 'Claim' : <Spin spinning />}
            </Button>
          </Grid>
        </Grid>
        <Divider type="vertical" />
        <Grid flow="row" gap={4}>
          <Text type="p2" color="secondary">
            Bond Balance
          </Text>
          <Grid flow="col" gap={16} align="center">
            <Skeleton loading={bondBalance === undefined}>
              <Text type="h3" weight="bold" color="primary">
                {formatBONDValue(bondBalance)}
              </Text>
            </Skeleton>
            <Icon name="static/token-bond" />
          </Grid>
        </Grid>
        <Divider type="vertical" />
        <Grid flow="row" gap={4}>
          <Text type="p2" color="secondary">
            Total voting power
          </Text>
          <Grid flow="col" gap={16} align="center">
            <Skeleton loading={votingPower === undefined}>
              <Text type="h3" weight="bold" color="primary">
                {formatBONDValue(votingPower)}
              </Text>
            </Skeleton>
            <Button type="light" onClick={() => setState({ showDetailedView: true })}>
              Detailed view
            </Button>

            {state.showDetailedView && <VotingDetailedModal onCancel={() => setState({ showDetailedView: false })} />}
          </Grid>
        </Grid>

        <UseLeftTime end={userLockedUntil ?? 0} delay={1_000} onEnd={handleLeftTimeEnd}>
          {leftTime => {
            const leftMultiplier = new BigNumber(multiplier - 1)
              .multipliedBy(leftTime)
              .div(loadedUserLockedUntil)
              .plus(1);

            return leftMultiplier.gt(1) ? (
              <>
                <Divider type="vertical" />
                <Grid flow="row" gap={4}>
                  <Hint
                    text={
                      <>
                        <Text type="p2">
                          The multiplier mechanic allows users to lock $BOND for a period up to 1 year and get a bonus
                          of up to 2x vBOND. The bonus is linear, as per the following example:
                        </Text>
                        <ul>
                          <li>
                            <Text type="p2">lock 1000 $BOND for 1 year → get back 2000 vBOND</Text>
                          </li>
                          <li>
                            <Text type="p2">lock 1000 $BOND for 6 months → get back 1500 vBOND</Text>
                          </li>
                        </ul>
                        <ExternalLink href="https://docs.barnbridge.com/governance/barnbridge-dao/multiplier-and-voting-power">
                          Learn more
                        </ExternalLink>
                      </>
                    }>
                    <Text type="p2" color="secondary">
                      Multiplier & Lock timer
                    </Text>
                  </Hint>

                  <Grid flow="col" gap={8} align="center">
                    <Tooltip title={`x${leftMultiplier}`}>
                      <Text type="lb1" weight="bold" color="red" className={s.ratio}>
                        {inRange(multiplier, 1, 1.01) ? '>' : ''} {formatBigValue(leftMultiplier, 2, '-', 2)}x
                      </Text>
                    </Tooltip>
                    <Text type="p2" color="secondary">
                      for
                    </Text>
                    <Text type="h3" weight="bold" color="primary">
                      {getFormattedDuration(0, userLockedUntil)}
                    </Text>
                  </Grid>
                </Grid>
              </>
            ) : undefined;
          }}
        </UseLeftTime>
      </Grid>
    </div>
  );
};

export default VotingHeader;
