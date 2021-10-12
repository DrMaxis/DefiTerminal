const inquirer = require('inquirer');
const actionChoices = require('../interactive/actions');
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
      if(answers.action === 'Arbitrage') {
        interactiveArbitrage.init();
      }
      if(answers.action === 'Prices') {
        interactiveMarket.init();
      }
      if(answers.action === 'Swap') {
        interactiveSwap.init();
      }
    });

}

exports.init = () => {
  startInteractiveProgram();
}