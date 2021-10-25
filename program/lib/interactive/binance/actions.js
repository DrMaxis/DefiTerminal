const actions = [
  {
    name: 'Commit Arbitrage'
  },
  {
    name: 'Swap Tokens'
  },
  {
    name: 'Fetch Exchange Prices'
  },
  {
    name: 'Monitor Exchange Prices'
  }
];
exports.actions = actions.map(function (a) {
  return a.name;
});