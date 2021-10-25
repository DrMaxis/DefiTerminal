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
        case 'Uniswap':
          fetcher.ethereum.fetchUniswapPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        case 'Kyber':
          fetcher.ethereum.fetchKyberPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        case 'Sushiswap':
          fetcher.ethereum.fetchSushiswapPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractivePriceFetcher();
}