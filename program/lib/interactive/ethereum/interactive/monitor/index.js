const inquirer = require('inquirer');
const monitorActions = require('./actions');


function runIntersctiveArbitrageMonitorProgram() {
  let interactiveArbitrageMonitorProgram = require('./interactive/arbitrage')
  return interactiveArbitrageMonitorProgram.init();
}

function runInteractivePriceMonitorProgram() {
  let interactivePriceMonitorProgram = require('./interactive/price');
  interactivePriceMonitorProgram.init();
}

function startInteractiveMonitor() {
  const questions = [
    {type: 'list', name: 'monitor', message: 'What Would You Like To Monitor?', choices: monitorActions.monitors},

  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      switch (answers.monitor) {
        case 'Arbitrage':
          runIntersctiveArbitrageMonitorProgram();
          break;
        case 'Prices':
          runInteractivePriceMonitorProgram();
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractiveMonitor();
}