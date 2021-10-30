const arbitrageActions = require("./actions");
const inquirer = require("inquirer");
const monitor = require('../../../../../../../utils/monitor');


function startInteractiveArbitrageMonitor() {
  const questions = [
    {type: 'list', name: 'pair', message: 'Target Asset Pair', choices: arbitrageActions.pairs},
    {type: 'list', name: 'buyingExchange', message: 'Exchange You Will Buy From', choices: arbitrageActions.exchanges},
    {type: 'list', name: 'sellingExchange', message: 'Exchange You Will Sell At', choices: arbitrageActions.exchanges},
    {type: 'list', name: 'network', message: 'Target Network', choices: arbitrageActions.networks},
    {type: 'input', name: 'borrowAmount', message: 'Borrow Amount(WETH)'},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      let data = {
        pair: answers.pair,
        network: answers.network,
        buyingExchange: answers.buyingExchange,
        sellingExchange: answers.sellingExchange,
        borrowAmount: answers.borrowAmount,
        chain: 'Ethereum'

      };
      monitor.ethereum.arbitrage.initArbitrageMonitor(data);
    });
}


exports.init = () => {
  startInteractiveArbitrageMonitor();
}