const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const marketFetcherActions = require("./actions");

function startInteractiveMarketFetcher() {
  const questions = [
    { type: 'list', name: 'token', message: 'What Token Do You Want To Analyze', choices: marketFetcherActions.tokens }
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      console.log(pad(colors.grey('Token info:'), 30), answers.token);
    });


}

exports.init = () => {
  startInteractiveMarketFetcher();
}