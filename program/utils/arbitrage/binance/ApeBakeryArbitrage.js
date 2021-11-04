require('dotenv').config();
const Web3 = require('web3');
const {mainnet} = require('../../addresses')
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");
const ApeBakeryFlashloan = require("../../../../build/contracts/ApeBakeryArbitrage.json");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    arbitrage(data);
  }
})

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function arbitrage(data) {
  const borrowAmount = data.borrowAmount;
  const oneWei = ( 10 ** 18 );
  let web3, networkId, flashloan;

  if(data.network === 'Local'){
    web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
    flashloan = new web3.eth.Contract(ApeBakeryFlashloan.abi, ApeBakeryFlashloan.networks[56].address);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
    networkId = await web3.eth.net.getId();
    flashloan = new web3.eth.Contract(ApeBakeryFlashloan.abi, ApeBakeryFlashloan.networks[networkId].address);
  }

  const bakeryswap = {
    factory: new web3.eth.Contract(mainnet.bakeryswap.factory.ABI, mainnet.bakeryswap.factory.address),
    router: new web3.eth.Contract(mainnet.bakeryswap.router.ABI, mainnet.bakeryswap.router.address),
  }

  const apeswap = {
    factory: new web3.eth.Contract(mainnet.apeswap.factory.ABI, mainnet.apeswap.factory.address),
    router: new web3.eth.Contract(mainnet.apeswap.router.ABI, mainnet.apeswap.router.address),
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


      const shiftedWBNBBorrowAmount = web3.utils.toBN(web3.utils.toWei(borrowAmount))

      // get BUSD AMOUNT
      const rawApeBUSDValue = await apeswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();

      let apeBUSDValueBN = await rawApeBUSDValue[1];

      // get WBNB/BUSD on Bakeryswap
      const rawBakeryBUSDValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();
      let bakeryBUSDValueBN = await rawBakeryBUSDValue[1];


      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      let shiftedBUSDBorrowAmount = apeBUSDValueBN;

      // get WBNB
      const rawApeWBNBValue = await apeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();

      let apeWBNBValueBN = await rawApeWBNBValue[1];

      // get BUSD/WBNB on Bakeryswap
      const rawBakeryWBNBValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const bakeryWBNBValueBN = await rawBakeryWBNBValue[1];

      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = shiftedWBNBBorrowAmount;

      const bakeryBUSDResults = {
        buy: (bUSDAmount / bakeryWBNBValueBN) * wBNBAmount,
        sell: (bakeryBUSDValueBN / wBNBAmount) * wBNBAmount
      }

      const bakeryWBNBResults = {
        buy: (wBNBAmount / bakeryBUSDValueBN) * bUSDAmount,
        sell: (bakeryWBNBValueBN / bUSDAmount) * bUSDAmount
      }

      const apeBUSDResults = {
        buy: (bUSDAmount / apeWBNBValueBN) * wBNBAmount,
        sell: (apeBUSDValueBN / wBNBAmount) * wBNBAmount
      }

      const apeWBNBResults = {
        buy: (wBNBAmount / apeBUSDValueBN) * bUSDAmount,
        sell: (apeWBNBValueBN / bUSDAmount) * bUSDAmount
      }


      const bakeryWBNBPrice = (bakeryWBNBResults.buy + bakeryWBNBResults.sell) / borrowAmount / 2
      const apeWBNBPrice = (apeWBNBResults.buy + apeWBNBResults.sell) / borrowAmount / 2


      const bakeryPaybackCalcBUSD = (bakeryBUSDResults.buy / 0.997);
      const bakeryPaybackBUSD = bakeryPaybackCalcBUSD.toString()
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD  - bakeryBUSDResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryWBNBResults.buy / 0.997);
      const bakeryPaybackWBNB = bakeryPaybackCalcWBNB.toString();
      const bakeryPaybackWBNBFee = (bakeryPaybackCalcWBNB  - bakeryWBNBResults.buy);

      const apePaybackCalcBUSD = (apeBUSDResults.buy / 0.997);
      const apePaybackBUSD = apePaybackCalcBUSD.toString();
      const apePaybackBUSDFee = apePaybackCalcBUSD - apeBUSDResults.buy;

      const apePaybackCalcWBNB = (apeWBNBResults.buy / 0.997);
      const apePaybackWBNB = apePaybackCalcWBNB.toString();
      const apePaybackWBNBFee = (apePaybackCalcWBNB - apeWBNBResults.buy);

      const gasPrice = await web3.eth.getGasPrice();
      const txCost = ((330000 * parseInt(gasPrice))) ;

      const bakeryToApeWBNBProfit = ((bakeryWBNBResults.buy - apeWBNBResults.sell - txCost - bakeryPaybackWBNBFee) / oneWei)
      const bakeryToApeBUSDProfit = ((bakeryBUSDResults.buy - apeBUSDResults.sell - txCost - bakeryPaybackBUSDFee) / oneWei)
      const apeToBakeryWBNBProfit = ((apeWBNBResults.buy - bakeryWBNBResults.sell - txCost - apePaybackWBNBFee) / oneWei)
      const apeToBakeryBUSDProfit = ((apeBUSDResults.buy - bakeryBUSDResults.sell - txCost - apePaybackBUSDFee) / oneWei)


      if (bakeryToApeWBNBProfit > 0 && bakeryToApeWBNBProfit > apeToBakeryWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan WBNB on Bakeryswap at ${((bakeryWBNBResults.buy) / oneWei)} `);
        console.log(`Sell WBNB on Apeswap at ${((apeWBNBResults.sell) / oneWei)} `);
        console.log(`Expected Flashswap Cost ${((apePaybackBUSDFee) / oneWei)} USD`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${bakeryToApeWBNBProfit} WBNB`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.apeswap.router.address, //aperouter
          apePaybackCalcBUSD
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin.address,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log("Waiting a block as to not redo transaction in same block");
        await sleep(15000)
      }
      if (apeToBakeryWBNBProfit > 0 && apeToBakeryWBNBProfit > bakeryToApeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Buy WBNB from Apeswap at ${((apeWBNBResults.buy) / oneWei)} `);
        console.log(`Sell WBNB from BakerySwap at ${((bakeryWBNBResults.sell) / oneWei)}`);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackBUSDFee) / oneWei)} USD`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${apeToBakeryWBNBProfit} WBNB`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.bakeryswap.router.address, // bakeryrouter
          bakeryPaybackCalcBUSD
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin.address,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log("Waiting a block as to not redo transaction in same block");
        await sleep(15000)
      }
      if (bakeryToApeBUSDProfit > 0 && bakeryToApeBUSDProfit > apeToBakeryBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Bakeryswap at ${((bakeryBUSDResults.buy) / oneWei)}`);
        console.log(`Sell BUSD on ApeSwap at ${((apeBUSDResults.sell) / oneWei)}`);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackWBNBFee) / oneWei)} BNB`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${bakeryToApeBUSDProfit} BUSD`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.apeswap.router.address, //aperouter
          apePaybackCalcWBNB
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin.address,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log("Waiting a block as to not redo transaction in same block");
        await sleep(15000)
      }
      if (apeToBakeryBUSDProfit > 0 && apeToBakeryBUSDProfit > bakeryToApeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Apeswap at ${((apeBUSDResults.buy) / oneWei)} `);
        console.log(`Sell BUSD on Bakeryswap at ${((bakeryBUSDResults.sell) / oneWei)} `);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackWBNBFee) / oneWei)} WBNB`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB` );
        console.log(`Expected profit: ${apeToBakeryBUSDProfit} BUSD`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.apeswap.router.address, //aperouter
          bakeryPaybackCalcWBNB
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin.address,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log("Waiting a block as to not redo transaction in same block");
        await sleep(15000)
      }

    })
    .on('error', error => {
      console.log(error);
    });
}
