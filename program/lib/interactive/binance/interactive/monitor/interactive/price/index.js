const inquirer = require("inquirer");
const arbitrageActions = require("./actions");
const monitor = require('../../../../../../../utils/monitor')


function startInteractivePriceMonitor() {
  const questions = [
    {type: 'list', name: 'pair', message: 'Target Asset Pair', choices: arbitrageActions.pairs},
    {type: 'list', name: 'exchange', message: 'Exchange', choices: arbitrageActions.exchanges},
    {type: 'list', name: 'network', message: 'Target Network', choices: arbitrageActions.networks},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      let data = {
        pair: answers.pair,
        network: answers.network,
        exchange: answers.exchange,
      };

      monitor.binance.prices.initPriceMonitor(data);
    });
}




exports.init = () => {
  startInteractivePriceMonitor();
}