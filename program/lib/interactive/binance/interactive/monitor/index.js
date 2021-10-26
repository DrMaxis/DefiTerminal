const inquirer = require('inquirer');
const monitorActions = require('./actions');


function runInteractiveArbitrageMonitorProgram() {
  let interactiveArbitrageMonitorProgram = require('./interactive/arbitrage')
  interactiveArbitrageMonitorProgram.init();
}

function runInteractivePriceMonitorProgram() {
  let interactivePriceMonitorProgram = require('./interactive/price');
  interactivePriceMonitorProgram.init();
}

async function startInteractiveMonitor() {
  const questions = [
    {type: 'list', name: 'monitor', message: 'What Would You Like To Monitor?', choices: monitorActions.monitors},

  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      switch (answers.monitor) {
        case 'Arbitrage':
         runInteractiveArbitrageMonitorProgram();
          break;
        case 'Prices':
         runInteractivePriceMonitorProgram();
          break;
        default:
      }
    });
}

exports.init = () => {
  return startInteractiveMonitor();
}