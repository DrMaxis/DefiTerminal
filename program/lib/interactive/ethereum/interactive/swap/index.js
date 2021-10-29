const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const swapActions = require("./actions");
const {swapper} = require("../../../../../utils/tokenswapper");


function startInteractiveSwap() {


  const questions = [
    { type: 'input', name: 'swapToken', message: 'What Token Do You Want To Swap? (Contract Address)' },
    { type: 'input', name: 'returnToken', message: 'What Token Do You Want Back? (Contract Address)' },
    { type: 'input', name: 'digits', message: 'Insert the amount of decimals your tokens contain. (Leave blank to default to 18)' },
    { type: 'list', name: 'exchange', message: 'What Exchange Do You Want To Use', choices: swapActions.exchanges },
    {type: 'input', name: 'amount', message: 'How much Do You Want To Swap?'},
    {type: 'input', name: 'slippage', message: 'Desired slippage'},
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {

      let data = {
        swapToken: answers.swapToken,
        returnToken: answers.returnToken,
        exchange: answers.exchange,
        amount:answers.amount,
        slippage:answers.slippage,
        digits: answers.digits
      };

      switch (answers.exchange){
        case 'Kyber':
          swapper.ethereum.swapOnKyber(data);
          break;
        case 'Sushiswap':
          swapper.ethereum.swapOnSushiswap(data);
          break;
        case 'Uniswap':
          swapper.ethereum.swapOnUniswap(data);
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractiveSwap();
}