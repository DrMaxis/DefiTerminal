const actions = [
  {name: 'Arbitrage'},
  {name: 'Swap'},
  {name: 'Prices'},
];
exports.actions = actions.map(function(a) {
  return a.name;
});
