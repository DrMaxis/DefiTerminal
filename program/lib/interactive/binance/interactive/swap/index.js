const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const swapActions = require("./actions");

function startInteractiveSwap() {


  const questions = [
    { type: 'list', name: 'swapToken', message: 'What Token Do You Want To Swap', choices: swapActions.tokens },
    { type: 'list', name: 'exchange', message: 'What Exchange Do You Want To Use', choices: swapActions.exchanges },
    {type: 'input', name: 'swapAmount', message: 'How much do you want to swap'},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      console.log(pad(colors.grey('Swap Token '), 30), answers.swapToken);
      console.log(pad(colors.grey('Swap Amount: '), 30), answers.swapAmount);
      console.log(pad(colors.grey('Exchange: '), 30), answers.exchange);
    });
}

exports.init = () => {
  startInteractiveSwap();
}