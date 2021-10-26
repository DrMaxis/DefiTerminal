require("dotenv").config();
const Web3 = require('web3');
const {mainnet, ropsten, kovan} = require('../../../../addresses')
const {Token, ChainId, Pair, TokenAmount} = require("@uniswap/sdk");



process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
})

 function fetchData(data) {
  let network, stableToken, tradingToken, web3, kyber;
  console.log(`Monitoring For Arbitrage Oppountunities of ${data.pair} between ${data.buyingExchange} & ${data.sellingExchange}`);
  const BORROW_AMOUNT = data.borrowAmount;
  const RECENT_ETH_PRICE = 1;
  const AMOUNT_TRADINGTOKEN_WEI = Web3.utils.toWei(BORROW_AMOUNT.toString());
  const AMOUNT_STABLETOKEN_WEI = Web3.utils.toWei((BORROW_AMOUNT * RECENT_ETH_PRICE).toString());

  switch (data.network) {
    case 'Mainnet':
      network = ChainId.MAINNET;
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN;
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address);
      break;
    case 'Kovan':
      network = ChainId.KOVAN;
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address);
      break;
    case 'Local':
      network = ChainId.MAINNET;
      stableToken = mainnet.tokenPairs[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider("http://localhost:8545"));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      break;
    default:
  }

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);
      const [stable, trade] = await Promise.all(
        [stableToken.address, tradingToken.address].map(tokenAddress => (
          Token.fetchData(
            network,
            tokenAddress,
          )
        )));

      const stableTrade = await Pair.fetchData(stable, trade);

      const kyberResults = await Promise.all([
        kyber
          .methods
          .getExpectedRate(
            stableToken.address,
            '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            AMOUNT_STABLETOKEN_WEI
          )
          .call(),
        kyber
          .methods
          .getExpectedRate(
            '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            stableToken.address,
            AMOUNT_TRADINGTOKEN_WEI
          )
          .call()
      ]);
      const kyberRates = {
        buy: parseFloat(1 / (kyberResults[0].expectedRate / (10 ** 18))),
        sell: parseFloat(kyberResults[1].expectedRate / (10 ** 18))
      };

      const uniswapResults = await Promise.all([
        stableTrade.getOutputAmount(new TokenAmount(stable, AMOUNT_STABLETOKEN_WEI)),
        stableTrade.getOutputAmount(new TokenAmount(trade, AMOUNT_TRADINGTOKEN_WEI))
      ]);
      const uniswapRates = {
        buy: parseFloat( AMOUNT_STABLETOKEN_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)),
        sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_TRADINGTOKEN_WEI),
      };

      console.log(`Current Buy Rates:  Uniswap:  ${uniswapRates.buy}, Kyber: ${kyberRates.buy}`);
      console.log(`Current Sell Rates:  Uniswap:  ${uniswapRates.sell}, Kyber: ${kyberRates.sell}`);

      const currentEthPrice = (uniswapRates.buy + uniswapRates.sell) / 2;
      const profit1 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (uniswapRates.sell - kyberRates.buy)  * currentEthPrice;
      const profit2 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (kyberRates.sell - uniswapRates.buy)  * currentEthPrice;
      if(profit1 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH on Kyber at ${kyberRates.buy} dai`);
        console.log(`Sell ETH on Uniswap at ${uniswapRates.sell} dai`);
        console.log(`Expected profit: ${profit1} dai`);
        process.send({profit: profit1})
      } else if(profit2 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH from Uniswap at ${uniswapRates.buy} dai`);
        console.log(`Sell ETH from Kyber at ${kyberRates.sell} dai`);
        console.log(`Expected profit: ${profit2} dai`);
        process.send({profit: profit2})
      }
    })
    .on('error', error => {
      console.log(error);
    });
}