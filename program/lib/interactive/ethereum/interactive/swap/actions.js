const tokens = [
  {
    name: 'WETH',
    description: 'Wrapped Ethereum Version 9'
  },
  {
    name: 'DAI',
    description: 'Dai Stablecoin'
  },
  {
    name: 'USDC',
    description: 'US-Dollar Stablecoin'
  }
];

const exchanges = [
  {
    name: 'Kyber',
    description: 'Kyber Decentralized Exchange'
  },
  {
    name: 'Uniswap',
    description: 'Uniswap Decentralized Exchange'
  },
  {
    name: 'Sushiswap',
    description: 'Sushiswap Decentralized Exchange'
  },
];

exports.tokens = tokens.map(function(token) {
  return {
    name: token.name,
  };
});

exports.exchanges = exchanges.map(function (exchange) {
  return exchange.name;
});