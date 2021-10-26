require("dotenv").config();
const Web3 = require('web3');
const pad = require("pad");
const colors = require("colors");
const ONE_WEI = Web3.utils.toBN(Web3.utils.toWei('1'));
const {mainnet, ropsten, kovan} = require('../../../../addresses');
const moment = require("moment");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    monitor(data);
  }
});


async function monitor(data) {
  let stableToken, tradingToken, sushi, web3;
  console.log(`Monitoring Sushiswap Prices For Pair: ${data.pair}...`)
  switch (data.network) {
    case 'Mainnet':
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      sushi = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      break;
    case 'Ropsten':
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      sushi = new web3.eth.Contract(ropsten.sushiswap.router.ABI, ropsten.sushiswap.router.address);
      break;
    case 'Kovan':
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      sushi = new web3.eth.Contract(kovan.sushiswap.router.ABI, kovan.sushiswap.router.address);
      break;
    case 'Local':
      web3 = new Web3(new Web3.providers.WebsocketProvider("https://127.0.0.1:8545"));
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      sushi = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      break;
  }
  let sushiswapEthSellPrice, sushiswapEthBuyPrice;
  const updateEthPrice = async () => {
    const sushiswapBuyPrice = await sushi.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
    const sushiswapSellPrice = await sushi.methods.getAmountsOut(web3.utils.toWei('1'), [stableToken.address, tradingToken.address]).call();

    sushiswapEthBuyPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapBuyPrice[1])).div(ONE_WEI);
    sushiswapEthSellPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapSellPrice[1])).div(ONE_WEI);

    console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + ' ' + moment().format('LTS'));
    console.log(pad(colors.red('Sushiswap Buy Price:'), 30), sushiswapEthBuyPrice.toString());
    console.log(pad(colors.green('Sushiswap Sell Price:'), 30), sushiswapEthSellPrice.toString())
  }

  setInterval(updateEthPrice, 5000);
}