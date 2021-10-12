const tokens = [
  {name: 'WETH', description: 'Wrapped Ethereum Version 9'},
  {name: 'ETH', description: 'Ethereum'}
];

exports.tokens = tokens.map(function(a) {
  return a.name;
});
