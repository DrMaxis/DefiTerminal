require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {mainnet} = require('../../../../addresses')
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    monitor(data);
  }
})


async function monitor(data) {
  const borrowAmount = data.borrowAmount;
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
  const apeswap = {
    factory: new web3.eth.Contract(mainnet.apeswap.factory.ABI, mainnet.apeswap.factory.address),
    router: new web3.eth.Contract(mainnet.apeswap.router.ABI, mainnet.apeswap.router.address),
  }
  const pancakeswap = {
    factory: new web3.eth.Contract(mainnet.pancakeswap.factory.ABI, mainnet.pancakeswap.factory.address),
    router: new web3.eth.Contract(mainnet.pancakeswap.router.ABI, mainnet.pancakeswap.router.address),
  }

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

  web3.eth.subscribe('newBlockHeaders', (error, result) => {
    if (!error) {
      return;
    }
    console.error(error);
  })
    .on("connected", subscriptionId => {
      console.log(`You are connected on ${subscriptionId}`);
    })
    .on('data', async block => {
      console.log('-------------------------------------------------------------');
      console.log(`New block received. Block # ${block.number}`);

      const borrowAmountBN = await new BigNumber(borrowAmount);
      const shiftedBorrowAmountBN = await new BigNumber(borrowAmountBN).shiftedBy(tradingToken.decimals);

      let tokenIn = tradingToken.address;
      let tokenOut = stableToken.address;


      // call getAmountsOut in Pancakeswap
      const rawPancakeValue = await pancakeswap.router.methods.getAmountsOut(shiftedBorrowAmountBN, [tokenIn, tokenOut]).call();
      const shiftedPancakeValue = await new BigNumber(rawPancakeValue[1]).shiftedBy(-stableToken.decimals);
      const pancakeValueBN = await new BigNumber(rawPancakeValue[1]);

      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + ' ' + moment().format('LTS'));
      console.log(pad(colors.yellow('Buying token at Pancakeswap DEX'), 30));
      console.log(pad(colors.red('tokenIn:'), 30), `${web3.utils.fromWei(shiftedBorrowAmountBN.toString())} ${tradingToken.name}`);
      console.log(pad(colors.green('tokenOut:'), 30), `${shiftedPancakeValue.toString()} ${stableToken.name}`);

      // call getAmountsOut in Apeswap
      const rawApeValue = await apeswap.router.methods.getAmountsOut(pancakeValueBN, [tokenOut, tokenIn]).call();
      const shiftedApeValue = await new BigNumber(rawApeValue[1]).shiftedBy(-tradingToken.decimals);
      const apeValueBN = await new BigNumber(rawApeValue[1]);

      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + ' ' + moment().format('LTS'));
      console.log(pad(colors.yellow('Buying back token at Apeswap DEX'), 30));
      console.log(pad(colors.red('tokenIn:'), 30), `${shiftedPancakeValue.toString()} ${tradingToken.name}`);
      console.log(pad(colors.green('tokenOut:'), 30), `${shiftedApeValue.toString()} ${stableToken.name}`);

      let profit = await new BigNumber(apeValueBN).minus(shiftedBorrowAmountBN);
      let profit2 = await new BigNumber(shiftedApeValue).minus(borrowAmountBN);


      console.log(`Current Profit Rate in ${tradingToken.name}: ${profit2.toString()}`);
      if (profit > 0) {
        console.log(
          pad(colors.green(`Block # ${block.number}: Arbitrage opportunity found!`), 30),
          `Expected profit: ${profit2.toString()} in ${tradingToken.name}`
        );
      } else {
        console.log(
          pad(colors.red(`Block # ${block.number}: Arbitrage opportunity not found!`), 30),
          `Expected profit: ${profit2.toString()} in ${tradingToken.name}`
        );
      }
    })
    .on('error', error => {
      console.log(error);
    });
}
