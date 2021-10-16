const Web3 = require('web3');
const { ChainId, Token, TokenAmount, Pair } = require('@uniswap/sdk');
const { mainnet, ropsten, kovan} = require('../../addresses');
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL)
);


const AMOUNT_ETH = 100;
const RECENT_ETH_PRICE = 1;
const AMOUNT_TRADINGTOKEN_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_BASETOKEN_WEI = web3.utils.toWei((AMOUNT_ETH * RECENT_ETH_PRICE).toString());


process.on('message', function(data) {
  if(data === false) {
    process.exit(1);
  } else{
    fetchData(data);
  }
});

function fetchData(data) {
  let network, stableToken, tradingToken;
  console.log(`Fetching Uniswap Prices For Pair: ${data.pair}...`)
  switch (data.network) {
    case 'Mainnet':
      network = ChainId.MAINNET
      stableToken = mainnet.tokenPairs[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs[data.pair].tradingToken;
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      break;
    case 'Kovan':
      network = ChainId.KOVAN
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      break;
  }
  //console.log(`Subscribing to the Ethereum Block Chain @ Network: ${tokenPair.network}`);
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
      process.send({rate: uniswapRates})
    })
    .on('error', error => {
      console.log(error.toString());
    });

}