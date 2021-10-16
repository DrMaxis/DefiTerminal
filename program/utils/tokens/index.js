const tokens = [
  {
    name: 'Bitcoin',
    coinMarketCapID: '1',
    slug: 'bitcoin',
    symbol: 'BTC'
  },
  {
    name: 'Ethereum',
    coinMarketCapID: '1027',
    slug: 'eth',
    symbol: 'ETH'
  },
  {
    name: 'Binance Coin',
    coinMarketCapID: '3',
    slug: 'bnb',
    symbol: 'BNB'
  },
  {
    name: 'Wrapped Ethereum',
    coinMarketCapID: '2396',
    slug: 'weth',
    symbol: 'WETH'
  },
  {
    name: 'Dai',
    coinMarketCapID: '4943',
    slug: 'multi-collateral-dai',
    symbol: 'DAI'
  },
  {
    name: 'USD Coin',
    coinMarketCapID: '3408',
    slug: 'usd-coin',
    symbol: 'USDC'
  },

];

exports.tokens = tokens.map(function(a) {
  return {
    id: a.coinMarketCapID,
    name: a.name,
    slug: a.slug,
    symbol: a.symbol
  };
});