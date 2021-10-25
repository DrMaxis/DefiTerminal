const inquirer = require('inquirer');
const monitorActions = require('./actions');
const interactiveArbitrageMonitorProgram = require('./interactive/arbitrage')
const interactivePriceMonitorProgram = require('./interactive/price');

function startInteractiveMonitor() {
  const questions = [
    {type: 'list', name: 'monitor', message: 'What Would You Like To Monitor?', choices: monitorActions.monitors},

  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      switch (answers.monitor) {
        case 'Arbitrage':
          interactiveArbitrageMonitorProgram.init();
          break;
        case 'Prices':
          interactivePriceMonitorProgram.init();
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractiveMonitor();
}