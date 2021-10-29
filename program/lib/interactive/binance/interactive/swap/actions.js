const tokens = [
  {
    name: 'WBNB',
    description: 'Wrapped Binance Coin'
  },
  {
    name: 'BUSD',
    description: 'Binance-Pegged US-Dollar'
  },
  {
    name: 'BUSDC',
    description: 'Binance-Pegged US-Dollar Coin'
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


exports.tokens = tokens.map(function(token) {
  return token.name;
});

exports.exchanges = exchanges.map(function(exchange) {
  return exchange.name;
});