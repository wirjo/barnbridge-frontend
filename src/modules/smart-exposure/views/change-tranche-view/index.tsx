import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { DropdownList } from 'components/custom/dropdown';
import Icon from 'components/custom/icon';
import IconsPair from 'components/custom/icons-pair';
import { TokenAmount, TokenAmountPreview } from 'components/custom/token-amount-new';
import TransactionDetails from 'components/custom/transaction-details';
import { Text } from 'components/custom/typography';

type ETokenType = '75:25_WBTC_ETH' | '50:50_WBTC_ETH' | '25:75_WBTC_ETH';

type ETokenOptionType = {
  value: ETokenType;
  name: string;
};

const ChangeTrancheView: React.FC = () => {
  const { pool } = useParams<{ pool: string }>();
  const [tokenState, setTokenState] = React.useState<string>('');

  const tokens: ETokenOptionType[] = React.useMemo(() => {
    return [
      {
        value: '75:25_WBTC_ETH',
        name: '75% WBTC / 25% ETH',
      },
      {
        value: '50:50_WBTC_ETH',
        name: '50% WBTC / 50% ETH',
      },
      {
        value: '25:75_WBTC_ETH',
        name: '25% WBTC / 75% ETH',
      },
    ];
  }, []);

  const [selectedToken, setSelectedToken] = React.useState<ETokenOptionType>(tokens[0]);

  return (
    <>
      <div
        className="flexbox-list align-middle mb-40 mh-auto"
        style={
          {
            maxWidth: 640,
            width: '100%',
            '--gap': '24px 64px',
            '--sm-gap': '24px',
            '--min': 'auto',
          } as React.CSSProperties
        }>
        <div className="flex">
          <IconsPair icon1="token-wbtc" icon2="token-eth" size={40} className="mr-16" />
          <div>
            <div className="text-p1 fw-semibold color-primary mr-4">75% WBTC / 25% ETH</div>
            <div className="text-sm fw-semibold color-secondary">Wrapped Bitcoin / Ethereum</div>
          </div>
        </div>
        <div>
          <div className="text-sm fw-semibold color-secondary mb-4">Wallet balance</div>
          <div>
            <span className="text-p1 fw-semibold color-primary mr-8">9.789</span>
            <span className="text-sm fw-semibold color-secondary">25:75_WBTC_ETH</span>
          </div>
        </div>
      </div>
      <div className="card ph-32 pv-32 mh-auto" style={{ width: '100%', maxWidth: 640 }}>
        <Text type="h3" weight="semibold" color="primary" className="mb-16">
          Change tranche
        </Text>
        <Text type="p2" weight="semibold" color="secondary" className="mb-32">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse efficitur odio nunc, a sodales ligula
          varius nec. Phasellus venenatis nulla mi, sit amet rutrum lorem semper et
        </Text>
        <form>
          <div className="flex mb-8">
            <span className="text-sm fw-semibold color-secondary">Select new tranche</span>
          </div>
          <DropdownList items={tokens.map(token => ({ children: token.name, onClick: () => setSelectedToken(token) }))}>
            {({ ref, setOpen, open }) => (
              <button type="button" ref={ref} onClick={() => setOpen(isOpen => !isOpen)} className="token-select mb-32">
                <IconsPair icon1="token-wbtc" icon2="token-eth" size={24} className="mr-16" />
                <Text type="p1" weight="semibold" color="primary">
                  {selectedToken.name}
                </Text>
                <Icon
                  name="dropdown"
                  width="24"
                  height="24"
                  className="token-select-chevron ml-auto"
                  style={{ transform: open ? 'rotate(180deg)' : '' }}
                />
              </button>
            )}
          </DropdownList>

          <div className="flex mb-8">
            <span className="text-sm fw-semibold color-secondary">75:25_WBTC_ETH amount</span>
          </div>
          <TokenAmount
            before={<IconsPair icon1="token-wbtc" icon2="token-eth" size={24} />}
            value={tokenState}
            onChange={setTokenState}
            max={9.789}
            placeholder={`0 (Max ${9.789})`}
            className="mb-40"
            slider
          />

          <div className="flex mb-8">
            <span className="text-sm fw-semibold color-secondary">50:50_WBTC_ETH amount</span>
          </div>
          <TokenAmountPreview
            before={<IconsPair icon1="token-wbtc" icon2="token-eth" size={24} />}
            value="2.3116"
            className="mb-32"
          />

          <TransactionDetails
            className="mb-32"
            showSlippage
            slippage={0.5}
            slippageHint="Your transaction will revert if the amount of tokens you actually receive is smaller by this percentage."
            showDeadline
            deadline={20}
            onChange={fd => console.log({ fd })}>
            Transaction details
          </TransactionDetails>

          <div className="grid flow-col col-gap-32 align-center justify-space-between">
            <Link to={`/smart-exposure/pairs/${pool}`} className="button-back">
              <Icon name="arrow-back" width={16} height={16} className="mr-8" color="inherit" />
              Cancel
            </Link>
            <button type="submit" className="button-primary">
              Deposit
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangeTrancheView;
