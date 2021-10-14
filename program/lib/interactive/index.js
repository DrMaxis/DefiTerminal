const inquirer = require('inquirer');
const actionChoices = require('./actions');
const interactiveArbitrage = require('./arbitrage');
const interactiveMarket = require('./market')
const interactiveSwap = require('./swap')

function startInteractiveProgram() {
  const questions = [
    { type: 'list', name: 'action', message: 'What do you want to do?', choices: actionChoices.actions },
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      if(answers.action === 'Commit Arbitrage') {
        interactiveArbitrage.init();
      }
      if(answers.action === 'Fetch Exchange Prices') {
        interactiveMarket.init();
      }
      if(answers.action === 'Swap Tokens') {
        interactiveSwap.init();
      }
    });

}

exports.init = () => {
  startInteractiveProgram();
}