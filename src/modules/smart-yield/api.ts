import BigNumber from 'bignumber.js';

import config from 'config';

import { PaginatedResult, queryfy } from 'utils/fetch';

export type SYMarketMeta = {
  id: string;
  name: string;
  icon: string;
};

export type SYPoolMeta = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const Markets = new Map<string, SYMarketMeta>([
  [
    'compound/v2',
    {
      id: 'compound/v2',
      name: 'Compound',
      icon: 'compound',
    },
  ],
  [
    'aave/v2',
    {
      id: 'aave/v2',
      name: 'AAVE',
      icon: `static/aave`,
    },
  ],
  [
    'cream/v2',
    {
      id: 'cream/v2',
      name: 'C.R.E.A.M Finance',
      icon: `cream_finance`,
    },
  ],
  [
    'aave-polygon',
    {
      id: 'aave-polygon',
      name: 'AAVE Polygon',
      icon: 'static/aave_polygon_grayed',
    },
  ],
]);

export const Pools = new Map<string, SYPoolMeta>([
  [
    'USDC',
    {
      id: 'USDC',
      name: 'USD Coin',
      icon: 'token-usdc',
      color: 'var(--theme-blue-color)',
    },
  ],
  [
    'DAI',
    {
      id: 'DAI',
      name: 'Dai Stablecoin',
      icon: 'token-dai',
      color: 'var(--theme-yellow-color)',
    },
  ],
  [
    'USDT',
    {
      id: 'USDT',
      name: 'Tether USD',
      icon: 'token-usdt',
      color: '#50af95',
    },
  ],
  [
    'GUSD',
    {
      id: 'GUSD',
      name: 'Gemini dollar',
      icon: 'token-gusd',
      color: '#00dcfa',
    },
  ],
]);

export type APISYPool = {
  protocolId: string;
  controllerAddress: string;
  modelAddress: string;
  providerAddress: string;
  smartYieldAddress: string;
  oracleAddress: string;
  juniorBondAddress: string;
  seniorBondAddress: string;
  cTokenAddress: string;
  underlyingAddress: string;
  underlyingSymbol: string;
  underlyingDecimals: number;
  rewardPoolAddress: string;
  state: {
    blockNumber: number;
    blockTimestamp: string;
    seniorLiquidity: number;
    juniorLiquidity: number;
    jTokenPrice: number;
    seniorApy: number;
    juniorApy: number;
    originatorApy: number;
    originatorNetApy: number;
    avgSeniorMaturityDays: number;
    numberOfSeniors: number;
    numberOfJuniors: number;
    juniorLiquidityLocked: number;
  };
};

export function fetchSYPools(originator = 'all'): Promise<APISYPool[]> {
  const url = new URL(`/api/smartyield/pools?originator=${originator}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => result.data);
}

export function fetchSYPool(originator: string, underlyingSymbol: string): Promise<APISYPool> {
  const url = new URL(
    `/api/smartyield/pools?originator=${originator}&underlyingSymbol=${underlyingSymbol}`,
    config.api.baseUrl,
  );

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => result.data?.[0]);
}

export type APISYPoolAPY = {
  point: Date;
  seniorApy: number;
  juniorApy: number;
  originatorNetApy: number;
};

export function fetchSYPoolAPY(syAddr: string, windowFilter: string = '24h'): Promise<APISYPoolAPY[]> {
  const query = queryfy({
    window: windowFilter,
  });

  const url = new URL(`/api/smartyield/pools/${syAddr}/apy?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => result.data);
}

export type APISYPoolLiquidity = {
  point: Date;
  seniorLiquidity: number;
  juniorLiquidity: number;
};

export function fetchSYPoolLiquidity(syAddr: string, windowFilter: string = '24h'): Promise<APISYPoolLiquidity[]> {
  const query = queryfy({
    window: windowFilter,
  });

  const url = new URL(`/api/smartyield/pools/${syAddr}/liquidity?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => result.data);
}

export type APISYPoolTransaction = {
  protocolId: string;
  pool: string;
  underlyingTokenAddress: string;
  underlyingTokenSymbol: string;
  amount: BigNumber;
  tranche: string;
  transactionType: string;
  transactionHash: string;
  blockTimestamp: number;
  blockNumber: number;
  accountAddress: string;
};

export function fetchSYPoolTransactions(
  poolAddress: string,
  page = 1,
  limit = 10,
  transactionType: string = 'all',
): Promise<PaginatedResult<APISYPoolTransaction>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    transactionType,
  });

  const url = new URL(`/api/smartyield/pools/${poolAddress}/transactions?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYPoolTransaction>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYPoolTransaction) => ({
        ...item,
        amount: new BigNumber(item.amount),
      })),
    }));
}

export type APISYSeniorBonds = {
  seniorBondId: number;
  maturityDate: number;
  redeemed: boolean;
  accountAddress: string;
  depositedAmount: BigNumber;
  redeemableAmount: BigNumber;
  underlyingTokenAddress: string;
  underlyingTokenSymbol: string;
  underlyingTokenDecimals: number;
  transactionHash: string;
  blockTimestamp: number;
};

export function fetchSYSeniorBonds(
  poolAddress: string,
  page = 1,
  limit = 10,
  redeemed?: string,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResult<APISYSeniorBonds>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    redeemed,
    sort: sortBy,
    sortDirection: sortDir,
  });

  const url = new URL(`/api/smartyield/pools/${poolAddress}/senior-bonds?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYSeniorBonds>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYSeniorBonds) => ({
        ...item,
        depositedAmount: new BigNumber(item.depositedAmount),
        redeemableAmount: new BigNumber(item.redeemableAmount),
      })),
    }));
}

export type APISYJuniorBonds = {
  juniorBondId: number;
  maturityDate: number;
  redeemed: boolean;
  accountAddress: string;
  depositedAmount: BigNumber;
  underlyingTokenAddress: string;
  underlyingTokenSymbol: string;
  underlyingTokenDecimals: number;
  transactionHash: string;
  blockTimestamp: number;
};

export function fetchSYJuniorBonds(
  poolAddress: string,
  page = 1,
  limit = 10,
  redeemed?: string,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResult<APISYJuniorBonds>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    redeemed,
    sort: sortBy,
    sortDirection: sortDir,
  });

  const url = new URL(`/api/smartyield/pools/${poolAddress}/junior-bonds?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYJuniorBonds>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYJuniorBonds) => ({
        ...item,
        depositedAmount: new BigNumber(item.depositedAmount),
      })),
    }));
}

export enum APISYTxHistoryType {
  JUNIOR_DEPOSIT = 'JUNIOR_DEPOSIT',
  JUNIOR_INSTANT_WITHDRAW = 'JUNIOR_INSTANT_WITHDRAW',
  JUNIOR_REGULAR_WITHDRAW = 'JUNIOR_REGULAR_WITHDRAW',
  JUNIOR_REDEEM = 'JUNIOR_REDEEM',
  SENIOR_DEPOSIT = 'SENIOR_DEPOSIT',
  SENIOR_REDEEM = 'SENIOR_REDEEM',
  JTOKEN_SEND = 'JTOKEN_SEND',
  JTOKEN_RECEIVE = 'JTOKEN_RECEIVE',
  JBOND_SEND = 'JBOND_SEND',
  JBOND_RECEIVE = 'JBOND_RECEIVE',
  SBOND_SEND = 'SBOND_SEND',
  SBOND_RECEIVE = 'SBOND_RECEIVE',
  JUNIOR_STAKE = 'JUNIOR_STAKE',
  JUNIOR_UNSTAKE = 'JUNIOR_UNSTAKE',
}

export const HistoryShortTypes = new Map<string, string>([
  [APISYTxHistoryType.JUNIOR_DEPOSIT, 'Deposit'],
  [APISYTxHistoryType.JUNIOR_INSTANT_WITHDRAW, 'Instant Withdraw'],
  [APISYTxHistoryType.JUNIOR_REGULAR_WITHDRAW, '2 Step Withdraw'],
  [APISYTxHistoryType.JUNIOR_REDEEM, 'Redeem'],
  [APISYTxHistoryType.JTOKEN_SEND, 'Token Send'],
  [APISYTxHistoryType.JTOKEN_RECEIVE, 'Token Receive'],
  [APISYTxHistoryType.JBOND_SEND, 'Bond Send'],
  [APISYTxHistoryType.JBOND_RECEIVE, 'Bond Receive'],
  [APISYTxHistoryType.JUNIOR_STAKE, 'Stake'],
  [APISYTxHistoryType.JUNIOR_UNSTAKE, 'Unstake'],
  [APISYTxHistoryType.SENIOR_DEPOSIT, 'Deposit'],
  [APISYTxHistoryType.SENIOR_REDEEM, 'Redeem'],
  [APISYTxHistoryType.SBOND_SEND, 'Bond Send'],
  [APISYTxHistoryType.SBOND_RECEIVE, 'Bond Receive'],
]);

export const HistoryTypes = new Map<string, string>([
  [APISYTxHistoryType.JUNIOR_DEPOSIT, 'Junior Deposit'],
  [APISYTxHistoryType.JUNIOR_INSTANT_WITHDRAW, 'Junior Instant Withdraw'],
  [APISYTxHistoryType.JUNIOR_REGULAR_WITHDRAW, 'Junior 2 Step Withdraw'],
  [APISYTxHistoryType.JUNIOR_REDEEM, 'Junior Redeem'],
  [APISYTxHistoryType.JTOKEN_SEND, 'Junior Token Send'],
  [APISYTxHistoryType.JTOKEN_RECEIVE, 'Junior Token Receive'],
  [APISYTxHistoryType.JBOND_SEND, 'Junior Bond Send'],
  [APISYTxHistoryType.JBOND_RECEIVE, 'Junior Bond Receive'],
  [APISYTxHistoryType.JUNIOR_STAKE, 'Junior Stake'],
  [APISYTxHistoryType.JUNIOR_UNSTAKE, 'Junior Unstake'],
  [APISYTxHistoryType.SENIOR_DEPOSIT, 'Senior Deposit'],
  [APISYTxHistoryType.SENIOR_REDEEM, 'Senior Redeem'],
  [APISYTxHistoryType.SBOND_SEND, 'Senior Bond Send'],
  [APISYTxHistoryType.SBOND_RECEIVE, 'Senior Bond Receive'],
]);

export function isPositiveHistoryType(type: APISYTxHistoryType) {
  return [
    APISYTxHistoryType.JUNIOR_DEPOSIT,
    APISYTxHistoryType.JTOKEN_RECEIVE,
    APISYTxHistoryType.JBOND_RECEIVE,
    APISYTxHistoryType.JUNIOR_STAKE,
    APISYTxHistoryType.SENIOR_DEPOSIT,
    APISYTxHistoryType.SBOND_RECEIVE,
  ].includes(type);
}

export type APISYUserTxHistory = {
  protocolId: string;
  pool: string;
  underlyingTokenAddress: string;
  underlyingTokenSymbol: string;
  amount: number;
  tranche: string;
  transactionType: string;
  transactionHash: string;
  blockTimestamp: number;
  blockNumber: number;
};

export function fetchSYUserTxHistory(
  address: string,
  page = 1,
  limit = 10,
  originator = 'all',
  token = 'all',
  transactionType = 'all',
): Promise<PaginatedResult<APISYUserTxHistory>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    originator,
    token,
    transactionType,
  });

  const url = new URL(`/api/smartyield/users/${address}/history?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYUserTxHistory>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYUserTxHistory) => ({
        ...item,
        amount: Number(item.amount),
      })),
    }));
}

export type APISYSeniorRedeem = {
  seniorBondAddress: string;
  userAddress: string;
  seniorBondId: number;
  smartYieldAddress: string;
  fee: number;
  underlyingIn: number;
  gain: number;
  forDays: number;
  blockTimestamp: number;
  transactionHash: string;
};

export function fetchSYSeniorRedeems(
  address: string,
  page = 1,
  limit = 10,
  originator = 'all',
  token = 'all',
): Promise<PaginatedResult<APISYSeniorRedeem>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    originator,
    token,
  });

  const url = new URL(`/api/smartyield/users/${address}/redeems/senior?=${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYSeniorRedeem>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYSeniorRedeem) => ({
        ...item,
      })),
    }));
}

export enum APISYJuniorPastPositionType {
  JUNIOR_REDEEM = 'JUNIOR_REDEEM',
  JUNIOR_INSTANT_WITHDRAW = 'JUNIOR_INSTANT_WITHDRAW',
}

export const JuniorPastPositionTypes = new Map<string, string>([
  [APISYJuniorPastPositionType.JUNIOR_REDEEM, 'Redeem'],
  [APISYJuniorPastPositionType.JUNIOR_INSTANT_WITHDRAW, 'Instant Withdraw'],
]);

export type APISYJuniorPastPosition = {
  protocolId: string;
  smartYieldAddress: string;
  underlyingTokenAddress: string;
  underlyingTokenSymbol: string;
  tokensIn: BigNumber;
  underlyingOut: BigNumber;
  forfeits: BigNumber;
  transactionType: string;
  blockTimestamp: number;
  transactionHash: string;
};

export function fetchSYJuniorPastPositions(
  address: string,
  page = 1,
  limit = 10,
  originator = 'all',
  token = 'all',
  transactionType = 'all',
): Promise<PaginatedResult<APISYJuniorPastPosition>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    originator,
    token,
    transactionType,
  });

  const url = new URL(`/api/smartyield/users/${address}/junior-past-positions?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYJuniorPastPosition>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYJuniorPastPosition) => ({
        ...item,
        tokensIn: new BigNumber(item.tokensIn),
        underlyingOut: new BigNumber(item.underlyingOut),
        forfeits: new BigNumber(item.forfeits),
      })),
    }));
}

export type APISYPortfolioValue = {
  timestamp: Date;
  seniorValue: number;
  juniorValue: number;
};

export function fetchSYPortfolioValues(address: string): Promise<APISYPortfolioValue[]> {
  const url = new URL(`/api/smartyield/users/${address}/portfolio-value`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result =>
      (result.data ?? []).map((item: APISYPortfolioValue) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })),
    );
}

export type APISYSeniorPortfolioValue = {
  timestamp: Date;
  seniorValue: number;
};

export function fetchSYSeniorPortfolioValues(address: string): Promise<APISYSeniorPortfolioValue[]> {
  const url = new URL(`/api/smartyield/users/${address}/portfolio-value/senior`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result =>
      (result.data ?? []).map((item: APISYSeniorPortfolioValue) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })),
    );
}

export type APISYJuniorPortfolioValue = {
  timestamp: Date;
  juniorValue: number;
};

export function fetchSYJuniorPortfolioValues(address: string): Promise<APISYJuniorPortfolioValue[]> {
  const url = new URL(`/api/smartyield/users/${address}/portfolio-value/junior`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result =>
      (result.data ?? []).map((item: APISYJuniorPortfolioValue) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })),
    );
}

export type APISYRewardPool = {
  poolAddress: string;
  poolTokenAddress: string;
  poolTokenDecimals: number;
  poolType: string; // SINGLE | MULTI
  protocolId: string;
  rewardTokens: {
    address: string;
    symbol: string;
    decimals: number;
  }[];
  underlyingAddress: string;
  underlyingSymbol: string;
};

export function fetchSYRewardPools(
  originator: string = 'all',
  underlyingSymbol: string = 'all',
): Promise<APISYRewardPool[]> {
  const url = new URL(
    `/api/smartyield/rewards/v2/pools?originator=${originator}&underlyingSymbol=${underlyingSymbol}`,
    config.api.baseUrl,
  );

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => result.data);
}

export enum APISYRewardTxHistoryType {
  JUNIOR_STAKE = 'JUNIOR_STAKE',
  JUNIOR_UNSTAKE = 'JUNIOR_UNSTAKE',
}

export const RewardHistoryShortTypes = new Map<string, string>([
  [APISYRewardTxHistoryType.JUNIOR_STAKE, 'Stake'],
  [APISYRewardTxHistoryType.JUNIOR_UNSTAKE, 'Unstake'],
]);

export type APISYRewardPoolTransaction = {
  userAddress: string;
  transactionType: string;
  amount: BigNumber;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
};

export function fetchSYRewardPoolTransactions(
  poolAddress: string,
  page = 1,
  limit = 10,
  userAddress: string = 'all',
  transactionType: string = 'all',
): Promise<PaginatedResult<APISYRewardPoolTransaction>> {
  const query = queryfy({
    page: String(page),
    limit: String(limit),
    userAddress,
    transactionType,
  });

  const url = new URL(`/api/smartyield/rewards/v2/pools/${poolAddress}/transactions?${query}`, config.api.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APISYRewardPoolTransaction>) => ({
      ...result,
      data: (result.data ?? []).map((item: APISYRewardPoolTransaction) => ({
        ...item,
        amount: new BigNumber(item.amount),
      })),
    }));
}
