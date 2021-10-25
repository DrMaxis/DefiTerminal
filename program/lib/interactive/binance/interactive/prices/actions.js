const pairs = [
  {
    name: 'WBNBBUSDC',
    description: 'Wrapped Binance Coin Over Binance Pegged USD Coin',
    stableToken: 'BUSDC',
    tradingToken: 'WBNB'
  },
  {
    name: 'WBNBBUSD',
    description: 'Wrapped Binance Coin Over Binance Pegged USD',
    stableToken: 'BUSD',
    tradingToken: 'WBNB'
  }
];

const exchanges = [
  {
    name: 'Apeswap',
    description: 'Apeswap Decentralized Exchange'
  },
  {
    name: 'Bakeryswap',
    description: 'Bakeryswap Decentralized Exchange'
  },
  {
    name: 'Pancakeswap',
    description: 'Pancakeswap Decentralized Exchange'
  },
];

const networks = [
  {
    name: 'Mainnet',
    description: 'The Main Binance Network'
  },
  {
    name: 'Local',
    description: 'Local Test Network'
  }
]

exports.pairs = pairs.map(function(pair) {
  return {
    name: pair.name,
    stableToken: pair.stableToken,
    tradingToken: pair.tradingToken
  };
});

exports.exchanges = exchanges.map(function (exchange) {
  return exchange.name;
});

exports.networks = networks.map(function (network) {
  return network.name;
})
