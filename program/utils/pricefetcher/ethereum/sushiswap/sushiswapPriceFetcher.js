const Web3 = require('web3');
const {mainnet, ropsten, kovan} = require('../../../addresses');
const ONE_WEI = Web3.utils.toBN(Web3.utils.toWei('1'));


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
});


async function fetchData(data) {
  let stableToken, tradingToken, sushi, web3;
  console.log(`Fetching Sushiswap Prices For Pair: ${data.pair}...`);
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
  let sushiswapEthPrice;
  const updateEthPrice = async () => {
    const sushiswapPrice = await sushi.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
    sushiswapEthPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapPrice[1])).div(ONE_WEI);
    process.send({sushiswapPrice: sushiswapEthPrice.toString()});
  }
  console.log('Fetching prices, please wait....')
  setInterval(updateEthPrice, 5000);
}