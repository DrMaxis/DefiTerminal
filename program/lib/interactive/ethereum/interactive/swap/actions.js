const tokens = [
  {name: 'WETH', description: 'Wrapped Ethereum Version 9'}
];

const exchanges = [
  {name: 'Uniswap', description: 'Uniswap Decentralized Exchange'},
  {name: 'Kyber', description: 'Kyber Decentralized Exchange'}
]

exports.tokens = tokens.map(function(a) {
  return a.name;
});
exports.exchanges = exchanges.map(function(a) {
  return a.name;
});