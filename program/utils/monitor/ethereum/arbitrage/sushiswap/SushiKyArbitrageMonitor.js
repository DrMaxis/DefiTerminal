require("dotenv").config();
const Web3 = require('web3');
const {mainnet, ropsten, kovan} = require('../../../../../utils/addresses');
const ONE_WEI = Web3.utils.toBN(Web3.utils.toWei('1'));



process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
})

async function fetchData(data) {
  let stableToken, tradingToken, web3, kyber, sushiswap;
  console.log(`Monitoring For Arbitrage Oppountunities of ${data.pair} between ${data.buyingExchange} & ${data.sellingExchange}`);
  const BORROW_AMOUNT = data.borrowAmount;
  const RECENT_ETH_PRICE = 1;
  const AMOUNT_TRADINGTOKEN_WEI = Web3.utils.toWei(BORROW_AMOUNT.toString());
  const AMOUNT_STABLETOKEN_WEI = Web3.utils.toWei((BORROW_AMOUNT * RECENT_ETH_PRICE).toString());

  switch (data.network) {
    case 'Mainnet':
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      sushiswap = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      break;
    case 'Ropsten':
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address);
      sushiswap = new web3.eth.Contract(ropsten.sushiswap.router.ABI, ropsten.sushiswap.router.address);
      break;
    case 'Kovan':
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address);
      sushiswap = new web3.eth.Contract(kovan.sushiswap.router.ABI, kovan.sushiswap.router.address);
      break;
    case 'Local':
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider("http://localhost:8545"));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      sushiswap = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      break;
  }

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);
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

      const sushiswapBuyPrice = await sushiswap.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
      const sushiswapSellPrice = await sushiswap.methods.getAmountsOut(web3.utils.toWei('1'), [stableToken.address, tradingToken.address]).call();

      const sushiswapEthBuyPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapBuyPrice[1])).div(ONE_WEI);
      const sushiswapEthSellPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapSellPrice[1])).div(ONE_WEI);

      console.log(`Current Buy Rates:  Kyber:  ${kyberRates.buy}, Sushiswap: ${sushiswapEthBuyPrice}`);
      console.log(`Current Sell Rates:  Kyber:  ${kyberRates.sell}, Sushiswap: ${sushiswapEthSellPrice}`);

      const currentEthPrice = (sushiswapEthBuyPrice + sushiswapEthSellPrice) / 2;
      const profit1 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (sushiswapEthSellPrice - kyberRates.buy)  * currentEthPrice;
      const profit2 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (kyberRates.sell - sushiswapEthBuyPrice)  * currentEthPrice;
      if(profit1 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH on Kyber at ${kyberRates.buy} dai`);
        console.log(`Sell ETH on Sushiswap at ${sushiswapEthSellPrice} dai`);
        console.log(`Expected profit: ${profit1} dai`);
        process.send({profit: profit1})
      } else if(profit2 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH from Sushiswap at ${sushiswapEthBuyPrice} dai`);
        console.log(`Sell ETH from Kyber at ${kyberRates.sell} dai`);
        console.log(`Expected profit: ${profit2} dai`);
        process.send({profit: profit2})
      }
    })
    .on('error', error => {
      console.log(error);
    });

}