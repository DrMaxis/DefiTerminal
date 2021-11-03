require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
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

      console.log(shiftedWBNBBorrowAmount.toString());
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
      let wBNBAmount = apeWBNBValueBN;

      const bakeryWBNBResults = {
        buy: (bUSDAmount / bakeryBUSDValueBN) * wBNBAmount,
        sell: (bakeryWBNBValueBN / wBNBAmount) * wBNBAmount
      }

      const bakeryBUSDResults = {
        buy: (wBNBAmount / bakeryWBNBValueBN) * bUSDAmount,
        sell: (bakeryBUSDValueBN / bUSDAmount) * bUSDAmount
      }

      const apeWBNBResults = {
        buy: (bUSDAmount / apeBUSDValueBN) * wBNBAmount,
        sell: (apeWBNBValueBN / wBNBAmount) * wBNBAmount
      }

      const apeBUSDResults = {
        buy: (wBNBAmount / apeWBNBValueBN) * bUSDAmount,
        sell: (apeBUSDValueBN / bUSDAmount) * bUSDAmount
      }

      console.log(apeWBNBResults, apeBUSDResults)

      const bakeryWBNBPrice = (Number(bakeryWBNBResults.buy) + Number(bakeryWBNBResults.sell)) / borrowAmount / 2
      const apeWBNBPrice = (Number(apeWBNBResults.buy) + Number(apeWBNBResults.sell)) / borrowAmount / 2

      const bakeryPaybackCalcBUSD = (bakeryWBNBResults.buy / 0.997) * 10 ** 18;
      const bakeryPaybackBUSD = bakeryPaybackCalcBUSD.toString()
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD / 10 ** 18 - bakeryWBNBResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryBUSDResults.buy / 0.997) * 10 ** 18;
      const bakeryPaybackWBNB = bakeryPaybackCalcWBNB.toString();
      const bakeryPaybackWBNBFee = (bakeryPaybackCalcWBNB / 10 ** 18  - bakeryBUSDResults.buy) * bakeryWBNBPrice;

      const apePaybackCalcBUSD = (apeWBNBResults.buy / 0.997) * 10 ** 18;
      const apePaybackBUSD = apePaybackCalcBUSD.toString();
      const apePaybackBUSDFee = apePaybackCalcBUSD / 10 ** 18   - apeWBNBResults.buy;

      const apePaybackCalcWBNB = (apeBUSDResults.buy / 0.997) * 10 ** 18;
      const apePaybackWBNB = apePaybackCalcWBNB.toString();
      const apePaybackWBNBFee = (apePaybackCalcWBNB / 10 ** 18  - apeBUSDResults.buy) * apeWBNBPrice;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = ((330000 * parseInt(gasPrice))/ 10 ** 18) * apeWBNBPrice;




      const bakeryToApeWBNBProfit = bakeryWBNBResults.sell - apeWBNBResults.buy - txCost - bakeryPaybackBUSDFee

      const bakeryToApeBUSDProfit = bakeryBUSDResults.sell - apeBUSDResults.buy - txCost - bakeryPaybackWBNBFee

      const apeToBakeryWBNBProfit = apeWBNBResults.sell - bakeryWBNBResults.buy - txCost - apePaybackBUSDFee

      const apeToBakeryBUSDProfit = apeBUSDResults.sell - bakeryBUSDResults.buy - txCost - apePaybackWBNBFee

      //console.log(apeToBakeryBUSDProfit)

      if (bakeryToApeWBNBProfit > 0 && bakeryToApeWBNBProfit > apeToBakeryWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan WBNB on Bakeryswap at ${bakeryWBNBResults.buy} `);
        console.log(`Sell WBNB on Apeswap at ${apeWBNBResults.sell} `);
        console.log(`Expected Flashswap Cost ${apePaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${bakeryToApeWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.apeswap.router.address, //aperouter
          apePaybackCalcBUSD.toString()
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
        sleep(15000)
      }
      if (apeToBakeryWBNBProfit > 0 && apeToBakeryWBNBProfit > bakeryToApeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Buy WBNB from Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB from BakerySwap at ${bakeryWBNBResults.sell}`);
        console.log(`Expected Flashswap Cost ${bakeryPaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${apeToBakeryWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.bakeryswap.router.address, // bakeryrouter
          bakeryPaybackCalcBUSD.toString()
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
        sleep(15000)
      }
      if (bakeryToApeBUSDProfit > 0 && bakeryToApeBUSDProfit > apeToBakeryBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell BUSD on ApeSwap at ${apeBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${bakeryPaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${bakeryToApeBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.apeswap.router.address, //aperouter
          apePaybackCalcWBNB.toString()
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
        sleep(15000)
      }
      if (apeToBakeryBUSDProfit > 0 && apeToBakeryBUSDProfit > bakeryToApeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Apeswap at ${apeBUSDResults.buy} `);
        console.log(`Sell BUSD on Bakeryswap at ${bakeryBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${bakeryPaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${apeToBakeryBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
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
        sleep(15000)
      }



    })
    .on('error', error => {
      console.log(error);
    });
}
