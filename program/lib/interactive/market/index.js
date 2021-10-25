const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const marketFetcherActions = require("./actions");
const {fetcher} = require('../../../utils/marketfetcher');

function startInteractiveMarketFetcher() {
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
          fetcher.fetchUniswapPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        case 'Kyber':
          fetcher.fetchKyberPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        case 'Sushiswap':
          fetcher.fetchSushiswapPairPrice(answers.exchange, answers.network, answers.pair);
          break;
        case 'Pancakeswap':
          fetcher.fetchPancakeswapPairPrice(answers.pair);
          break;
        case 'Bakeryswap':
          fetcher.fetchBakeryswapPairPrice(answers.pair);
          break;
        case 'Apeswap':
          fetcher.fetchApeswapPairPrice(answers.pair);
          break;
        default:
      }
    });
}

exports.init = () => {
  startInteractiveMarketFetcher();
}