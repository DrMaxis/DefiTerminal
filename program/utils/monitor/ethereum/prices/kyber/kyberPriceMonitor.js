const Web3 = require('web3');
const {mainnet, ropsten, kovan} = require('../../../../addresses');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");
const AMOUNT_ETH = 100;
const RECENT_ETH_PRICE = 1;
const AMOUNT_TRADINGTOKEN_WEI = Web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_STABLETOKEN_WEI = Web3.utils.toWei((AMOUNT_ETH * RECENT_ETH_PRICE).toString());


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    monitor(data);
  }
})


function monitor(data) {
  let stableToken, web3, kyber;
  console.log(`Monitoring Kyber Prices For Pair: ${data.pair}...`)
  switch (data.network) {
    case 'Mainnet':
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      break;
    case 'Ropsten':
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address);
      break;
    case 'Kovan':
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      kyber = new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address);
      break;
    case 'Local':
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider("http://localhost:8545"));
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
  }

  if (data.network === 'Local') {
    (async () => {
      const kyberResults = await Promise.all([
        kyber
          .methods
          .getExpectedRate(
            stableToken.address,
            '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', //Kyber ETH //TODO: implement kyber focused tokens
            AMOUNT_STABLETOKEN_WEI
          )
          .call(),
        kyber
          .methods
          .getExpectedRate(
            '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', //Kyber ETH //TODO: implement kyber focused tokens
            stableToken.address,
            AMOUNT_TRADINGTOKEN_WEI
          )
          .call()
      ]);
      const kyberRates = {
        buy: parseFloat(1 / (kyberResults[0].expectedRate / (10 ** 18))),
        sell: parseFloat(kyberResults[1].expectedRate / (10 ** 18))
      };
      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + '' + moment().format('LTS'));
      console.log(pad(colors.red('Kyber WETH Buy Price:'), 30), kyberRates.buy);
      console.log(pad(colors.green('Kyber WETH Sell Price:'), 30), kyberRates.sell);
    })()
  }
  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
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
      console.log(pad(colors.yellow('Current I/O Values as of '), 30), moment().format('ll') + ' ' + moment().format('LTS'));
      console.log(pad(colors.red('Kyber WETH Buy Price:'), 30), kyberRates.buy);
      console.log(pad(colors.green('Kyber WETH Sell Price:'), 30), kyberRates.sell);
    })
    .on('error', error => {
      console.log(error.toString());
    });

}