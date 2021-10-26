const inquirer = require("inquirer");
const actionChoices = require('./actions');


function runInteractiveArbitrage() {
  let interactiveArbitrage = require('./interactive/arbitrage');
  interactiveArbitrage.init();
}

function runInteractivePrices() {
  let interactivePrices = require('./interactive/prices');
  interactivePrices.init();
}

function runInteractiveMonitor() {
  let interactiveMonitor = require('./interactive/monitor');
  interactiveMonitor.init();
}

function runInteractiveSwap() {
  let interactiveSwap = require('./interactive/swap');
  interactiveSwap.init();
}

function startInteractiveEthereumProgram() {

  const questions = [
    {type: 'list', name: 'action', message: 'What do you want to do?', choices: actionChoices.actions},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      if (answers.action === 'Commit Arbitrage') {
        runInteractiveArbitrage();
      }
      if (answers.action === 'Fetch Exchange Prices') {
        runInteractivePrices();
      }
      if (answers.action === 'Monitor Exchange Prices') {
        runInteractiveMonitor();
      }
      if (answers.action === 'Swap Tokens') {
        runInteractiveSwap();
      }
    });

}


exports.init = () => {
  startInteractiveEthereumProgram();
}