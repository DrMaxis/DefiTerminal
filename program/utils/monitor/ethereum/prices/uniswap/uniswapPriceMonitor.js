const Web3 = require('web3');
const pad = require("pad");
const colors = require("colors");
const {mainnet, ropsten, kovan} = require('../../../../addresses');
const {ChainId, Token, TokenAmount, Pair} = require('@uniswap/sdk');
const moment = require("moment");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
});

function fetchData(data) {
  let network, stableToken, tradingToken, web3;
  console.log(`Monitoring Uniswap Prices For Pair: ${data.pair}...`)
  switch (data.network) {
    case 'Mainnet':
      network = ChainId.MAINNET
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      break;
    case 'Kovan':
      network = ChainId.KOVAN
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      break;
    case 'Local':
      network = ChainId.MAINNET
      web3 = new Web3(new Web3.providers.WebsocketProvider("https://127.0.0.1:8545"));
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      break;
  }

  const AMOUNT_ETH = 100;
  const RECENT_ETH_PRICE = 1;
  const AMOUNT_TRADINGTOKEN_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
  const AMOUNT_BASETOKEN_WEI = web3.utils.toWei((AMOUNT_ETH * RECENT_ETH_PRICE).toString());

  //console.log(`Subscribing to the Ethereum Block Chain @ Network: ${tokenPair.network}`);

  if (data.network === 'Local') {
    (async () => {
      const [stable, trade] = await Promise.all(
        [stableToken.address, tradingToken.address].map(tokenAddress => (
          Token.fetchData(
            network,
            tokenAddress,
          )
        )));

      const pair = await Pair.fetchData(
        stable,
        trade,
      );

      const uniswapResults = await Promise.all([
        pair.getOutputAmount(new TokenAmount(stable, AMOUNT_BASETOKEN_WEI)),
        pair.getOutputAmount(new TokenAmount(trade, AMOUNT_TRADINGTOKEN_WEI))
      ]);
      const uniswapRates = {
        buy: parseFloat(AMOUNT_BASETOKEN_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)),
        sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_ETH),
      };
      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + ' ' + moment().format('LTS'));
      console.log(pad(colors.red('Uniswap WETH Buy Price:'), 30), uniswapRates.buy);
      console.log(pad(colors.green('Uniswap WETH Sell Price:'), 30), uniswapRates.sell);
    })()

  }
  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      //console.log(`New block received. Block # ${block.number}`);
      const [stable, trade] = await Promise.all(
        [stableToken.address, tradingToken.address].map(tokenAddress => (
          Token.fetchData(
            network,
            tokenAddress,
          )
        )));

      const pair = await Pair.fetchData(
        stable,
        trade,
      );

      const uniswapResults = await Promise.all([
        pair.getOutputAmount(new TokenAmount(stable, AMOUNT_BASETOKEN_WEI)),
        pair.getOutputAmount(new TokenAmount(trade, AMOUNT_TRADINGTOKEN_WEI))
      ]);
      const uniswapRates = {
        buy: parseFloat(AMOUNT_BASETOKEN_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)),
        sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_ETH),
      };
      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + '' + moment().format('LTS'));
      console.log(pad(colors.red('Uniswap WETH Buy Price:'), 30), uniswapRates.buy);
      console.log(pad(colors.green('Uniswap WETH Sell Price:'), 30), uniswapRates.sell);
    })
    .on('error', error => {
      console.log(error.toString());
    });

}