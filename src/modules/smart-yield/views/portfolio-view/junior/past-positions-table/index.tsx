import React from 'react';
import { ColumnsType } from 'antd/lib/table/interface';
import BigNumber from 'bignumber.js';
import format from 'date-fns/format';
import {
  ZERO_BIG_NUMBER,
  formatBigValue,
  formatUSDValue,
  getEtherscanAddressUrl,
  getEtherscanTxUrl,
  shortenAddr,
} from 'web3/utils';

import Table from 'components/antd/table';
import Tooltip from 'components/antd/tooltip';
import ExternalLink from 'components/custom/externalLink';
import Icon from 'components/custom/icon';
import IconBubble from 'components/custom/icon-bubble';
import { Text } from 'components/custom/typography';
import { mergeState } from 'hooks/useMergeState';
import { APISYJuniorPastPosition, JuniorPastPositionTypes, fetchSYJuniorPastPositions } from 'modules/smart-yield/api';
import { PoolsSYPool, usePools } from 'modules/smart-yield/providers/pools-provider';
import { useWallet } from 'wallets/wallet';

type TableEntity = APISYJuniorPastPosition & {
  pool?: PoolsSYPool;
  forfeits?: BigNumber;
};

const Columns: ColumnsType<TableEntity> = [
  {
    title: 'Token Name',
    render: (_, entity) => (
      <div className="flex flow-col align-center">
        <IconBubble
          name={entity.pool?.meta?.icon}
          bubbleName="static/token-bond"
          secondBubbleName={entity.pool?.market?.icon}
          className="mr-16"
        />
        <div className="flex flow-row">
          <ExternalLink href={getEtherscanAddressUrl(entity.pool?.smartYieldAddress)} className="flex flow-col mb-4">
            <Text type="p1" weight="semibold" color="blue" className="mr-4">
              {entity.pool?.underlyingSymbol}
            </Text>
            <Icon name="arrow-top-right" width={8} height={8} color="blue" />
          </ExternalLink>
          <Text type="small" weight="semibold">
            {entity.pool?.market?.name}
          </Text>
        </div>
      </div>
    ),
  },
  {
    title: 'Transaction hash/timestamp',
    render: (_, entity) => (
      <>
        <ExternalLink href={getEtherscanTxUrl(entity.transactionHash)} className="link-blue mb-4">
          {shortenAddr(entity.transactionHash)}
        </ExternalLink>
        <Text type="small" weight="semibold" color="secondary">
          {format(entity.blockTimestamp * 1_000, 'MM.dd.yyyy HH:mm')}
        </Text>
      </>
    ),
  },
  {
    title: 'Tokens in',
    align: 'right',
    sorter: (a, b) => a.tokensIn.toNumber() - b.tokensIn.toNumber(),
    render: (_, entity) => (
      <>
        <Tooltip title={formatBigValue(entity.tokensIn, entity.pool?.underlyingDecimals)}>
          <Text type="p1" weight="semibold" color="primary">
            {formatBigValue(entity.tokensIn)}
            {` ${entity.pool?.contracts.smartYield?.symbol}`}
          </Text>
        </Tooltip>
        <Text type="small" weight="semibold" color="secondary">
          {formatUSDValue(entity.tokensIn.multipliedBy(entity.pool?.state.jTokenPrice ?? ZERO_BIG_NUMBER))}
        </Text>
      </>
    ),
  },
  {
    title: 'Underlying out',
    align: 'right',
    sorter: (a, b) => a.underlyingOut.toNumber() - b.underlyingOut.toNumber(),
    render: (_, entity) => (
      <>
        <Tooltip title={formatBigValue(entity.underlyingOut, entity.pool?.underlyingDecimals)}>
          <Text type="p1" weight="semibold" color="primary">
            {formatBigValue(entity.underlyingOut)}
            {` ${entity.pool?.underlyingSymbol}`}
          </Text>
        </Tooltip>
        <Text type="small" weight="semibold" color="secondary">
          {formatUSDValue(entity.underlyingOut)}
        </Text>
      </>
    ),
  },
  {
    title: 'Forfeits',
    align: 'right',
    sorter: (a, b) => a.forfeits?.toNumber() ?? 0 - b.underlyingOut?.toNumber() ?? 0,
    render: (_, entity) => (
      <>
        <Tooltip title={formatBigValue(entity.forfeits ?? ZERO_BIG_NUMBER, entity.pool?.underlyingDecimals)}>
          <Text type="p1" weight="semibold" color="primary">
            {formatBigValue(entity.forfeits ?? ZERO_BIG_NUMBER)}
            {` ${entity.pool?.underlyingSymbol}`}
          </Text>
        </Tooltip>
        <Text type="small" weight="semibold" color="secondary">
          {formatUSDValue(entity.forfeits ?? ZERO_BIG_NUMBER)}
        </Text>
      </>
    ),
  },
  {
    title: 'Withdraw type',
    align: 'right',
    render: (_, entity) => (
      <Text type="p1" weight="semibold" color="primary">
        {JuniorPastPositionTypes.get(entity.transactionType)}
      </Text>
    ),
  },
];

type State = {
  loading: boolean;
  data: TableEntity[];
  total: number;
  pageSize: number;
  page: number;
};

const InitialState: State = {
  loading: false,
  data: [],
  total: 0,
  pageSize: 10,
  page: 1,
};

type Props = {
  originatorFilter: string;
  tokenFilter: string;
  transactionTypeFilter: string;
};

const PastPositionsTable: React.FC<Props> = props => {
  const { originatorFilter, tokenFilter, transactionTypeFilter } = props;

  const wallet = useWallet();
  const poolsCtx = usePools();

  const { pools } = poolsCtx;

  const [state, setState] = React.useState<State>(InitialState);

  React.useEffect(() => {
    (async () => {
      if (!wallet.account) {
        return;
      }

      setState(
        mergeState<State>({
          loading: true,
        }),
      );

      try {
        const pastPositions = await fetchSYJuniorPastPositions(
          wallet.account,
          state.page,
          state.pageSize,
          originatorFilter,
          tokenFilter,
          transactionTypeFilter,
        );

        const data = pastPositions.data.map(item => {
          const pool = pools.find(poolItem => poolItem.smartYieldAddress === item.smartYieldAddress);

          return {
            ...item,
            pool,
          };
        });

        setState(
          mergeState<State>({
            loading: false,
            data,
            total: pastPositions.meta.count,
          }),
        );
      } catch {
        setState(
          mergeState<State>({
            loading: false,
            data: [],
            total: 0,
          }),
        );
      }
    })();
  }, [wallet.account, state.page, originatorFilter, tokenFilter, transactionTypeFilter]);

  function handlePageChange(page: number) {
    setState(
      mergeState<State>({
        page,
      }),
    );
  }

  return (
    <Table<TableEntity>
      columns={Columns}
      dataSource={state.data}
      rowKey="transactionHash"
      loading={state.loading}
      pagination={{
        total: state.total,
        pageSize: state.pageSize,
        current: state.page,
        position: ['bottomRight'],
        showTotal: (total: number, [from, to]: [number, number]) => (
          <Text type="p2" weight="semibold" color="secondary">
            Showing {from} to {to} out of {total} entries
          </Text>
        ),
        onChange: handlePageChange,
      }}
      scroll={{
        x: true,
      }}
    />
  );
};

export default PastPositionsTable;
