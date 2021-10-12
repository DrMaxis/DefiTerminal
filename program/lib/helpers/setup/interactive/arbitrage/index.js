const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const arbitrageActions = require('./actions');

function startInteractiveArbitrage() {
  const questions = [
    { type: 'list', name: 'borrowToken', message: 'What Token Do You Want To Borrow', choices: arbitrageActions.tokens },
    { type: 'input', name: 'borrowAmount', message: 'How much will you borrow' },
    { type: 'list', name: 'exchange', message: 'What Exchange Will You Attack', choices: arbitrageActions.exchanges },
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      console.log(pad(colors.grey('Borrow Token: '), 30), answers.borrowToken);
      console.log(pad(colors.grey('Borrow Amount: '), 30), answers.borrowAmount);
      console.log(pad(colors.grey('Exchange: '), 30), answers.exchange);
    });
}



exports.init = () => {
  startInteractiveArbitrage();
}