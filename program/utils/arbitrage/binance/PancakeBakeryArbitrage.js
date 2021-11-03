require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {mainnet} = require('../../addresses')
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");
const PancakeBakeryFlashloan = require("../../../../build/contracts/PancakeBakeryArbitrage.json");


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
  const admin  = Web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
  let web3, networkId, flashloan;
  
  if(data.network === 'Local'){
    web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
    flashloan = new web3.eth.Contract(PancakeBakeryFlashloan.abi, PancakeBakeryFlashloan.networks[56].address);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
    networkId = await web3.eth.net.getId();
    flashloan = new web3.eth.Contract(PancakeBakeryFlashloan.abi, PancakeBakeryFlashloan.networks[networkId].address);
  }
  
  const bakeryswap = {
    factory: new web3.eth.Contract(mainnet.bakeryswap.factory.ABI, mainnet.bakeryswap.factory.address),
    router: new web3.eth.Contract(mainnet.bakeryswap.router.ABI, mainnet.bakeryswap.router.address),
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


      const shiftedWBNBBorrowAmount = web3.utils.toBN(web3.utils.toWei(borrowAmount))

      console.log(shiftedWBNBBorrowAmount.toString());
      // get BUSD AMOUNT
      const rawPancakeBUSDValue = await pancakeswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();

      let pancakeBUSDValueBN = await rawPancakeBUSDValue[1];

      // get WBNB/BUSD on Bakeryswap
      const rawBakeryBUSDValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();
      let bakeryBUSDValueBN = await rawBakeryBUSDValue[1];


      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      let shiftedBUSDBorrowAmount = pancakeBUSDValueBN;

      // get WBNB
      const rawPancakeWBNBValue = await pancakeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();

      let pancakeWBNBValueBN = await rawPancakeWBNBValue[1];

      // get BUSD/WBNB on Bakeryswap
      const rawBakeryWBNBValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const bakeryWBNBValueBN = await rawBakeryWBNBValue[1];

      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = pancakeWBNBValueBN;

      const bakeryWBNBResults = {
        buy: (bUSDAmount / bakeryBUSDValueBN) * wBNBAmount,
        sell: (bakeryWBNBValueBN / wBNBAmount) * wBNBAmount
      }

      const bakeryBUSDResults = {
        buy: (wBNBAmount / bakeryWBNBValueBN) * bUSDAmount,
        sell: (bakeryBUSDValueBN / bUSDAmount) * bUSDAmount
      }

      const pancakeWBNBResults = {
        buy: (bUSDAmount / pancakeBUSDValueBN) * wBNBAmount,
        sell: (pancakeWBNBValueBN / wBNBAmount) * wBNBAmount
      }

      const pancakeBUSDResults = {
        buy: (wBNBAmount / pancakeWBNBValueBN) * bUSDAmount,
        sell: (pancakeBUSDValueBN / bUSDAmount) * bUSDAmount
      }

      console.log(pancakeWBNBResults, pancakeBUSDResults)

      const bakeryWBNBPrice = (Number(bakeryWBNBResults.buy) + Number(bakeryWBNBResults.sell)) / borrowAmount / 2
      const pancakeWBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / borrowAmount / 2

      const bakeryPaybackCalcBUSD = (bakeryWBNBResults.buy / 0.997) * 10 ** 18;
      const bakeryPaybackBUSD = bakeryPaybackCalcBUSD.toString()
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD / 10 ** 18 - bakeryWBNBResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryBUSDResults.buy / 0.997) * 10 ** 18;
      const bakeryPaybackWBNB = bakeryPaybackCalcWBNB.toString();
      const bakeryPaybackWBNBFee = (bakeryPaybackCalcWBNB / 10 ** 18  - bakeryBUSDResults.buy) * bakeryWBNBPrice;

      const pancakePaybackCalcBUSD = (pancakeWBNBResults.buy / 0.997) * 10 ** 18;
      const pancakePaybackBUSD = pancakePaybackCalcBUSD.toString();
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD / 10 ** 18   - pancakeWBNBResults.buy;

      const pancakePaybackCalcWBNB = (pancakeBUSDResults.buy / 0.997) * 10 ** 18;
      const pancakePaybackWBNB = pancakePaybackCalcWBNB.toString();
      const pancakePaybackWBNBFee = (pancakePaybackCalcWBNB / 10 ** 18  - pancakeBUSDResults.buy) * pancakeWBNBPrice;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = ((330000 * parseInt(gasPrice))/ 10 ** 18) * pancakeWBNBPrice;




      const bakeryToPancakeWBNBProfit = bakeryWBNBResults.sell - pancakeWBNBResults.buy - txCost - bakeryPaybackBUSDFee

      const bakeryToPancakeBUSDProfit = bakeryBUSDResults.sell - pancakeBUSDResults.buy - txCost - bakeryPaybackWBNBFee

      const pancakeToBakeryWBNBProfit = pancakeWBNBResults.sell - bakeryWBNBResults.buy - txCost - pancakePaybackBUSDFee

      const pancakeToBakeryBUSDProfit = pancakeBUSDResults.sell - bakeryBUSDResults.buy - txCost - pancakePaybackWBNBFee

      //console.log(pancakeToBakeryBUSDProfit)

      if (bakeryToPancakeWBNBProfit > 0 && bakeryToPancakeWBNBProfit > pancakeToBakeryWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan WBNB on Bakeryswap at ${bakeryWBNBResults.buy} `);
        console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
        console.log(`Expected Flashswap Cost ${pancakePaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${bakeryToPancakeWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.pancakeswap.router.address, //pancakerouter
          pancakePaybackCalcBUSD.toString()
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
      if (pancakeToBakeryWBNBProfit > 0 && pancakeToBakeryWBNBProfit > bakeryToPancakeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Buy WBNB from Pancakeswap at ${pancakeWBNBResults.buy} `);
        console.log(`Sell WBNB from BakerySwap at ${bakeryWBNBResults.sell}`);
        console.log(`Expected Flashswap Cost ${bakeryPaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${pancakeToBakeryWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.pancakeswap.factory.address, //pancakefactory
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
      if (bakeryToPancakeBUSDProfit > 0 && bakeryToPancakeBUSDProfit > pancakeToBakeryBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${pancakeBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${bakeryPaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${bakeryToPancakeBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.pancakeswap.router.address, //pancakerouter
          pancakePaybackCalcWBNB.toString()
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
      if (pancakeToBakeryBUSDProfit > 0 && pancakeToBakeryBUSDProfit > bakeryToPancakeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Pancakeswap at ${pancakeBUSDResults.buy} `);
        console.log(`Sell BUSD on Bakeryswap at ${bakeryBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${bakeryPaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${pancakeToBakeryBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
          mainnet.pancakeswap.router.address, //pancakerouter
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
