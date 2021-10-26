require("dotenv").config();
const Web3 = require('web3');
const {mainnet, ropsten, kovan} = require('../../../../addresses');
const {TokenAmount, Token, Pair, ChainId} = require("@uniswap/sdk");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
})


async function fetchData(data) {
  let network, stableToken, tradingToken, web3, soloAddress, uniswap, sushiswap, sushiswapEthPrice;
  console.log(`Initiating Arbitrage of ${data.pair} between ${data.buyingExchange} & ${data.sellingExchange}`);

  switch (data.network) {
    case 'Mainnet':
      network = ChainId.MAINNET;
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      soloAddress = mainnet.dydx.solo.address;
      sushiswap = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      uniswap = new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address);
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN;
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      //TODO: GET ROPSTEN DYDX SOLO ADDRESS
      sushiswap = new web3.eth.Contract(ropsten.sushiswap.router.ABI, ropsten.sushiswap.router.address);
      break;
    case 'Kovan':
      network = ChainId.KOVAN;
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      soloAddress = kovan.dydx.solo.address;
      sushiswap = new web3.eth.Contract(kovan.sushiswap.router.ABI, kovan.sushiswap.router.address);
      break;
    case 'Local':
      network = ChainId.MAINNET;
      stableToken = mainnet.tokenPairs.Ethereum[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs.Ethereum[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
      soloAddress = mainnet.dydx.solo.address;
      sushiswap = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      uniswap = new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address);
      break;
  }

  const BORROW_AMOUNT = data.borrowAmount;
  const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));
  const AMOUNT_TRADINGTOKEN_WEI = web3.utils.toWei(BORROW_AMOUNT);
  const AMOUNT_STABLETOKEN_WEI = web3.utils.toWei(BORROW_AMOUNT);

  // Determine prices on uniswap
  const [stable, trade] = await Promise.all(
    [stableToken.address, tradingToken.address].map(tokenAddress => (
      Token.fetchData(
        network,
        tokenAddress,
      )
    )));
  const stableTrade = await Pair.fetchData(stable, trade);
  const uniswapResults = await Promise.all([
    stableTrade.getOutputAmount(new TokenAmount(stable, AMOUNT_STABLETOKEN_WEI)),
    stableTrade.getOutputAmount(new TokenAmount(trade, AMOUNT_TRADINGTOKEN_WEI))
  ]);
  const uniswapRates = {
    buy: parseFloat( AMOUNT_STABLETOKEN_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)),
    sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_TRADINGTOKEN_WEI),
  };

  // Determine prices on sushiswap

  const sushiswapPrice = await sushiswap.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
  sushiswapEthPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapPrice[1])).div(ONE_WEI);

  console.log(`Current Buy Rates:  Uniswap:  ${uniswapRates.buy}, Sushiswap: ${sushiswapEthPrice.toString()}`);
  console.log(`Current Sell Rates:  Uniswap:  ${uniswapRates.sell}, Sushiswap: `);

  if(data.network === 'Local') {

    let exchange = 'UniSwap';
    switch (exchange) {
      // buy on sushiswap
      case 'SushiSwap':
        /**
         *  Buying Ether on sushi with dia borrowed from dydx
         *  then selling the Ether on Uniswap for dia
         */
          // Get the amount of ETH out from buying using Dia from Sushiswap
        const amountETHFromSushi = await sushiswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();

        // Get the amount of Dia out from Selling ETH on Uniswap
        const amountDiaFromUni = await uniswap.methods.getAmountsOut(amountETHFromSushi[1], [tradingToken.address, stableToken.address]).call();

        console.log(`Sushi -> Uniswap.  Dai Going in / Dai Going Out}: ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountDiaFromUni[1].toString())}`);
        //do other stuff
        break;
      case 'UniSwap':
        /**
         *  Buying Ether on uniswap with dia borrowed from dydx
         *  then selling the Ether on Sushi for dia
         */
          // Get the amount of ETH out from buying using Dia
        const amountETHFromUni = await uniswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
        // Get the amount of Dia out from Selling Eth on Sushi
        const amountDiaFromSushi = await sushiswap.methods.getAmountsOut(amountETHFromUni[1], [tradingToken.address, stableToken.address]).call();
        console.log(`Uniswap -> Sushi.  Dai Going In  / Dai Going Out ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountDiaFromSushi[1].toString())}`);
        break;
      default:

    }

    //Buy on uni
    const amountETHFromUni = await uniswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
    // Get the amount of Dia out from Selling Eth on Sushi
    const amountDiaFromSushi = await sushiswap.methods.getAmountsOut(amountETHFromUni[0], [tradingToken.address, stableToken.address]).call();
    console.log(`Uniswap -> Sushi.  Dai Going In  / Dai Going Out ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountDiaFromSushi[1].toString())}`);

    //const diaFromBuyingOnSushiSellingOnUni = web3.utils.toBN(amountDiaFromUni[1])
    //const daiFromBuyingOnUniSellingOnSushi = web3.utils.toBN(amountDiaFromSushi[1])
    //console.log(daiFromBuyingOnUniSellingOnSushi.toString(), daiFromBuyingOnUniSellingOnSushi.gt(AMOUNT_STABLETOKEN_WEI))

    // if(daiFromBuyingOnUniSellingOnSushi.gt(AMOUNT_STABLETOKEN_WEI)) {
    //   const tx = flashloan.methods.initiateFlashloan(
    //     soloAddress,
    //     stableToken.address,
    //     AMOUNT_STABLETOKEN_WEI,
    //     DIRECTION.UNISWAP_TO_SUSHI
    //   );
    //   const [gasPrice] = await Promise.all([
    //     web3.eth.getGasPrice(),
    //   ]);
    //   console.log('gasPrice', gasPrice)
    //
    //   const gasCost = 30000000;
    //   console.log('gasCost', gasCost) ;
    //
    //   // const gasCostX =  new Promise(function(resolve, reject) {
    //   //   resolve(tx.estimateGas({from: admin.address}))
    //   // })
    //   // console.log('gasX', gasCostX)
    //   // const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(uniswapEthPrice);
    //   //const profit = daiFromBuyingOnUniSellingOnSushi.sub(AMOUNT_STABLETOKEN_WEI);
    //   //Amount_Eth_WEI/10^18 ×(uniswapRates.sell - kyberRates.buy)- (txCost/ 10^18) × current EthPrice
    //
    //
    //
    //   console.log('arbitrage value', daiFromBuyingOnUniSellingOnSushi);
    //   console.log('borrow amount in wei', AMOUNT_STABLETOKEN_WEI);
    //   console.log('convert borrow amount into BN', web3.utils.toBN(AMOUNT_STABLETOKEN_WEI));
    //   console.log('subtract arbitrage value from borrow amount', daiFromBuyingOnUniSellingOnSushi.sub(web3.utils.toBN(AMOUNT_STABLETOKEN_WEI)))
    //
    //   let profit = daiFromBuyingOnUniSellingOnSushi.sub(web3.utils.toBN(AMOUNT_STABLETOKEN_WEI));
    //   let convertedProfit = profit.div(ONE_WEI).toString();
    //   console.log('profit', profit.div(ONE_WEI).toString());
    //   if (convertedProfit > 0) {
    //     console.log('Arb opportunity found Sushi -> Uniswap!');
    //     console.log(`Expected profit: ${web3.utils.fromWei(profit)} Dai`);
    //     const data = tx.encodeABI();
    //     const txData = {
    //       from: admin.address,
    //       to: flashloan.options.address,
    //       data,
    //       gas: gasCost,
    //       gasPrice
    //     };
    //     const receipt = await web3.eth.sendTransaction(txData);
    //     console.log(`Transaction hash: ${receipt.transactionHash}`);
    //   }
    // }
  }


  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);
      let exchange = 'SushiSwap';
      let amountETHFromSushi, amountDiaFromUni, amountETHFromUni, amountDiaFromSushi;

      switch (exchange) {
        // buy on sushiswap
        case 'SushiSwap':
          /**
           *  Buying Ether on sushi with dia borrowed from dydx
           *  then selling the Ether on Uniswap for dia
           */
          // Get the amount of ETH out from buying using Dia from Sushiswap
          amountETHFromSushi = await sushiswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
          // Get the amount of Dia out from Selling ETH on Uniswap
          amountDiaFromUni = await uniswap.methods.getAmountsOut(amountETHFromSushi[1], [tradingToken.address, stableToken.address]).call();
          console.log(`Sushi -> Uniswap.  Dai Going in / Dai Going Out}: ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountDiaFromUni[1].toString())}`);
          break;
        case 'UniSwap':
          /**
           *  Buying Ether on uniswap with dia borrowed from dydx
           *  then selling the Ether on Sushi for dia
           */
          // Get the amount of ETH out from buying using Dia
          amountETHFromUni = await uniswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
          // Get the amount of Dia out from Selling Eth on Sushi
          amountDiaFromSushi = await sushiswap.methods.getAmountsOut(amountETHFromUni[1], [tradingToken.address, stableToken.address]).call();
          console.log(`Uniswap -> Sushi.  Dai Going In  / Dai Going Out ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountDiaFromSushi[1].toString())}`);
          break;
        default:
      }

      // const diaFromBuyingOnSushiSellingOnUni = web3.utils.toBN(amountDiaFromUni[1]);
      // const daiFromBuyingOnUniSellingOnSushi = web3.utils.toBN(amountDiaFromSushi[1]);
      // if(daiFromBuyingOnUniSellingOnSushi.gt(AMOUNT_STABLETOKEN_WEI)) {
      //
      //   // const gasCostX =  new Promise(function(resolve, reject) {
      //   //   resolve(tx.estimateGas({from: admin.address}))
      //   // })
      //   // console.log('gasX', gasCostX)
      //   // const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(uniswapEthPrice);
      //   //const profit = daiFromBuyingOnUniSellingOnSushi.sub(AMOUNT_STABLETOKEN_WEI);
      //   //Amount_Eth_WEI/10^18 ×(uniswapRates.sell - kyberRates.buy)- (txCost/ 10^18) × current EthPrice
      //
      //   console.log('arbitrage value', daiFromBuyingOnUniSellingOnSushi);
      //   console.log('borrow amount in wei', AMOUNT_STABLETOKEN_WEI);
      //   console.log('convert borrow amount into BN', web3.utils.toBN(AMOUNT_STABLETOKEN_WEI));
      //   console.log('subtract arbitrage value from borrow amount', daiFromBuyingOnUniSellingOnSushi.sub(web3.utils.toBN(AMOUNT_STABLETOKEN_WEI)))
      //
      //   let profit = daiFromBuyingOnUniSellingOnSushi.sub(web3.utils.toBN(AMOUNT_STABLETOKEN_WEI));
      //   let convertedProfit = profit.div(ONE_WEI).toString();
      //   console.log('profit', profit.div(ONE_WEI).toString());
      //   if (convertedProfit > 0) {
      //     console.log('Arb opportunity found Sushi -> Uniswap!');
      //     console.log(`Expected profit: ${web3.utils.fromWei(profit)} Dai`);
      //     process.send({profit: convertedProfit})
      //   }
      // }
      // if(diaFromBuyingOnSushiSellingOnUni.gt(AMOUNT_STABLETOKEN_WEI)) {
      //   const profit = diaFromBuyingOnSushiSellingOnUni.sub(web3.utils.toBN(AMOUNT_STABLETOKEN_WEI));
      //   if(profit > 0) {
      //     console.log('Arb opportunity found Uniswap -> Sushi!');
      //     console.log(`Expected profit: ${web3.utils.fromWei(profit)} Dai`);
      //     process.send({profit: profit})
      //   }
      // }

    })
    .on('error', error => {
      console.log(error);
    });

}