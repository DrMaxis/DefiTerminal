const inquirer = require("inquirer");
const actionChoices = require('./actions');
const interactiveSwap = require('./interactive/swap');
const interactivePrices = require('./interactive/prices');
const interactiveMonitor = require('./interactive/monitor');
const interactiveArbitrage = require('./interactive/arbitrage');

function startInteractiveEthereumProgram() {

  const questions = [
    {type: 'list', name: 'action', message: 'What do you want to do?', choices: actionChoices.actions},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      if (answers.action === 'Commit Arbitrage') {
        interactiveArbitrage.init();
      }
      if (answers.action === 'Fetch Exchange Prices') {
        interactivePrices.init();
      }
      if (answers.action === 'Monitor Exchange Prices') {
        interactiveMonitor.init();
      }
      if (answers.action === 'Swap Tokens') {
        interactiveSwap.init();
      }
    });

}


exports.init = () => {
  startInteractiveEthereumProgram();
}