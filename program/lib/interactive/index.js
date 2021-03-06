const inquirer = require('inquirer');
const chainChoices = require('./actions');
const interactiveEthereumProgram = require('./ethereum');
//

function startInteractiveProgram() {
  const questions = [
    {type: 'list', name: 'chain', message: 'What Chain Do You Want To Work On', choices: chainChoices.chains},
  ];


  inquirer
    .prompt(questions)
    .then(function (answers) {
      if (answers.chain === 'Ethereum') {
        interactiveEthereumProgram.init();
      }

      if (answers.chain === 'Binance') {
        let interactiveBinanceProgram = require('./binance')
        interactiveBinanceProgram.init();
      }

    });
}

exports.init = () => {
  startInteractiveProgram();
}