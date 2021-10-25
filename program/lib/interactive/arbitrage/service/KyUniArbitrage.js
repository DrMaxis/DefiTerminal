require("dotenv").config();
const Web3 = require('web3');
const _ = require('lodash');
const {mainnet, ropsten, kovan} = require('../../../../utils/addresses');
const {Token, ChainId, Pair, TokenAmount} = require("@uniswap/sdk");
const Flashloan = require("../../../../../artifacts/contracts/KyUniFlashloan.sol/KyUniFlashloan.json");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
})


async function fetchData(data) {
  let network, stableToken, tradingToken, web3, kyber, flashloan, networkId, soloAddress, admin;
  console.log(`Initiating Arbitrage of ${data.pair} between ${data.buyingExchange} & ${data.sellingExchange}`);
  const BORROW_AMOUNT = data.borrowAmount;
  const RECENT_ETH_PRICE = 1;
  const AMOUNT_TRADINGTOKEN_WEI = Web3.utils.toWei(BORROW_AMOUNT.toString());
  const AMOUNT_STABLETOKEN_WEI = Web3.utils.toWei((BORROW_AMOUNT * RECENT_ETH_PRICE).toString());

  const DIRECTION = {
    KYBER_TO_UNISWAP: 0,
    UNISWAP_TO_KYBER: 1
  };
  switch (data.network) {
    case 'Mainnet':
      network = ChainId.MAINNET
      stableToken = mainnet.tokenPairs[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
       networkId = await web3.eth.net.getId();
       flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
       soloAddress = mainnet.dydx.solo.address;
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      kyber = new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
     //TODO: GET ROPSTEN DYDX SOLO ADDRESS
      break;
    case 'Kovan':
      network = ChainId.KOVAN
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      kyber = new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
      soloAddress = kovan.dydx.solo.address;
      break;
    case 'Local':
      network = ChainId.MAINNET
      stableToken = mainnet.tokenPairs[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider("http://localhost:8545"));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      kyber = new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
      soloAddress = mainnet.dydx.solo.address;
      break;
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
            stableToken,address,
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
      console.log('Kyber ETH/DAI');
      console.log(kyberRates);

      const uniswapResults = await Promise.all([
        stableTrade.getOutputAmount(new TokenAmount(stable, AMOUNT_STABLETOKEN_WEI)),
        stableTrade.getOutputAmount(new TokenAmount(trade, AMOUNT_TRADINGTOKEN_WEI))
      ]);
      const uniswapRates = {
        buy: parseFloat( AMOUNT_STABLETOKEN_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)),
        sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_ETH),
      };
      console.log('Uniswap ETH/DAI');
      console.log(uniswapRates);

      const [tx1, tx2] = Object.keys(DIRECTION).map(direction => flashloan.methods.initiateFlashloan(
        soloAddress,
        stableToken.address,
        AMOUNT_STABLETOKEN_WEI,
        DIRECTION[direction]
      ));
      const [gasPrice, gasCost1, gasCost2] = await Promise.all([
        web3.eth.getGasPrice(),
        tx1.estimateGas({from: admin}),
        tx2.estimateGas({from: admin})
      ]);
      const txCost1 = parseInt(gasCost1) * parseInt(gasPrice);
      const txCost2 = parseInt(gasCost2) * parseInt(gasPrice);
      const currentEthPrice = (uniswapRates.buy + uniswapRates.sell) / 2;
      const profit1 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (uniswapRates.sell - kyberRates.buy) - (txCost1 / 10 ** 18) * currentEthPrice;
      const profit2 = (parseInt(AMOUNT_TRADINGTOKEN_WEI) / 10 ** 18) * (kyberRates.sell - uniswapRates.buy) - (txCost2 / 10 ** 18) * currentEthPrice;
      if(profit1 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH on Kyber at ${kyberRates.buy} dai`);
        console.log(`Sell ETH on Uniswap at ${uniswapRates.sell} dai`);
        console.log(`Expected profit: ${profit1} dai`);
        const data = tx1.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: gasCost1,
          gasPrice
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      } else if(profit2 > 0) {
        console.log('Arb opportunity found!');
        console.log(`Buy ETH from Uniswap at ${uniswapRates.buy} dai`);
        console.log(`Sell ETH from Kyber at ${kyberRates.sell} dai`);
        console.log(`Expected profit: ${profit2} dai`);
        const data = tx2.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: gasCost2,
          gasPrice
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        process.send({receipt: receipt})
      }
    })
    .on('error', error => {
      console.log(error);
    });

}