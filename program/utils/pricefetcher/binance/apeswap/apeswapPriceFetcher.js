require("dotenv").config();
const Web3 = require('web3');
const BigNumber = require("bignumber.js");
const {mainnet} = require('../../../addresses');
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));

const apeswap = {
  factory: new web3.eth.Contract(mainnet.apeswap.factory.ABI, mainnet.apeswap.factory.address),
  router: new web3.eth.Contract(mainnet.apeswap.router.ABI, mainnet.apeswap.router.address),
}

const baseAmount = 1;

process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
});

async function fetchData(data) {
  let stableToken = {
    name: mainnet.tokenPairs.Binance[data.pair].stableToken.name,
    address: mainnet.tokenPairs.Binance[data.pair].stableToken.address,
    decimals: mainnet.tokenPairs.Binance[data.pair].stableToken.decimals,
  }

  let tradingToken = {
    name: mainnet.tokenPairs.Binance[data.pair].tradingToken.name,
    address: mainnet.tokenPairs.Binance[data.pair].tradingToken.address,
    decimals: mainnet.tokenPairs.Binance[data.pair].tradingToken.decimals,
  }


  console.log(`Fetching Ape Swap Prices...`)
  web3.eth.subscribe('newBlockHeaders', (error, result) => {
    if (!error) {
      return;
    }
    console.error(error);
  })
    .on("Connected To Binance SmartChain", subscriptionId => {
      console.log(`You are connected on ${subscriptionId}`);
    })
    .on('data', async block => {
      console.log('-------------------------------------------------------------');
      const exchangeAmount = await new BigNumber(baseAmount);
      const shiftedExchangeAmount = await new BigNumber(exchangeAmount).shiftedBy(tradingToken.decimals);
      let tokenIn = tradingToken.address
      let tokenOut = stableToken.address;
      const rawValue = await apeswap.router.methods.getAmountsOut(shiftedExchangeAmount, [tokenIn, tokenOut]).call();
      const shiftedValue = await new BigNumber(rawValue[1]).shiftedBy(-stableToken.decimals);

      process.send({
        tokenIn: {
          name: tradingToken.name,
          value: exchangeAmount.toString(),
        },
        tokenOut: {
          name: stableToken.name,
          value: shiftedValue.toString()
        }
      });

    })
    .on('error', error => {
      console.log(error);
    });
}