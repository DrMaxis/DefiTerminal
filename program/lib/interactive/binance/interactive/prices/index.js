const inquirer = require('inquirer');
const marketFetcherActions = require("./actions");
const {fetcher} = require('../../../../../utils/pricefetcher');

function startInteractivePriceFetcher() {
  const questions = [
    { type: 'list', name: 'exchange', message: 'Choose An Exchange', choices: marketFetcherActions.exchanges },
    { type: 'list', name: 'network', message: 'On What Network', choices: marketFetcherActions.networks },
    { type: 'list', name: 'pair', message: 'Choose A Pair', choices: marketFetcherActions.pairs }
  ];

  inquirer
    .prompt(questions)
    .then(function (answers) {
      switch (answers.exchange){
        case 'Apeswap':
          fetcher.binance.fetchApeswapPairPrice(answers.pair);
          break;
          case 'Bakeryswap':
          fetcher.binance.fetchBakeryswapPairPrice(answers.pair);
          break;
        case 'Pancakeswap':
          fetcher.binance.fetchPancakeswapPairPrice(answers.pair);
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractivePriceFetcher();
}