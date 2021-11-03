require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {mainnet} = require('../../addresses')
const PancakeApeFlashloan =require('../../../../build/contracts/PancakeApeArbitrage.json');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");

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
     flashloan = new web3.eth.Contract(PancakeApeFlashloan.abi, PancakeApeFlashloan.networks[56].address);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
     networkId = await web3.eth.net.getId();
     flashloan = new web3.eth.Contract(PancakeApeFlashloan.abi, PancakeApeFlashloan.networks[networkId].address);
  }


  const admin  = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

  const apeswap = {
    factory: new web3.eth.Contract(mainnet.apeswap.factory.ABI, mainnet.apeswap.factory.address, {from: admin.address}),
    router: new web3.eth.Contract(mainnet.apeswap.router.ABI, mainnet.apeswap.router.address, {from: admin.address}),
  }
  const pancakeswap = {
    factory: new web3.eth.Contract(mainnet.pancakeswap.factory.ABI, mainnet.pancakeswap.factory.address, {from: admin.address}),
    router: new web3.eth.Contract(mainnet.pancakeswap.router.ABI, mainnet.pancakeswap.router.address, {from: admin.address}),
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



  if(data.network === 'Local') {

    async function runLocalAritrage(){
      const shiftedWBNBBorrowAmount = web3.utils.toBN(web3.utils.toWei(borrowAmount))

      console.log(shiftedWBNBBorrowAmount.toString());
      // get BUSD AMOUNT
      const rawPancakeBUSDValue = await pancakeswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();

      let pancakeBUSDValueBN = await rawPancakeBUSDValue[1];

      // get WBNB/BUSD on Apeswap
      const rawApeBUSDValue = await apeswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();
      let apeBUSDValueBN = await rawApeBUSDValue[1];


      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      let shiftedBUSDBorrowAmount = pancakeBUSDValueBN;

      // get WBNB
      const rawPancakeWBNBValue = await pancakeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();

      let pancakeWBNBValueBN = await rawPancakeWBNBValue[1];

      // get BUSD/WBNB on Apeswap
      const rawApeWBNBValue = await apeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const apeWBNBValueBN = await rawApeWBNBValue[1];

      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = pancakeWBNBValueBN;

      const apeWBNBResults = {
        buy: (bUSDAmount / apeBUSDValueBN) * wBNBAmount,
        sell: (apeWBNBValueBN / wBNBAmount) * wBNBAmount
      }

      const apeBUSDResults = {
        buy: (wBNBAmount / apeWBNBValueBN) * bUSDAmount,
        sell: (apeBUSDValueBN / bUSDAmount) * bUSDAmount
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

      const apeWBNBPrice = (Number(apeWBNBResults.buy) + Number(apeWBNBResults.sell)) / borrowAmount / 2
      const pancakeWBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / borrowAmount / 2

      const apePaybackCalcBUSD = (apeWBNBResults.buy / 0.997) * 10 ** 18;
      const apePaybackBUSD = apePaybackCalcBUSD.toString()
      const apePaybackBUSDFee = apePaybackCalcBUSD / 10 ** 18 - apeWBNBResults.buy;

      const apePaybackCalcWBNB = (apeBUSDResults.buy / 0.997) * 10 ** 18;
      const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).toString();
      const apePaybackWBNBFee = (apePaybackCalcWBNB / 10 ** 18  - apeBUSDResults.buy) * apeWBNBPrice;

      const pancakePaybackCalcBUSD = (pancakeWBNBResults.buy / 0.997) * 10 ** 18;
      const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).toString();
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD / 10 ** 18   - pancakeWBNBResults.buy;

      const pancakePaybackCalcWBNB = (pancakeBUSDResults.buy / 0.997) * 10 ** 18;
      const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).toString();
      const pancakePaybackWBNBFee = (pancakePaybackCalcWBNB / 10 ** 18  - pancakeBUSDResults.buy) * pancakeWBNBPrice;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = ((330000 * parseInt(gasPrice))/ 10 ** 18) * pancakeWBNBPrice;




      const apeToPancakeWBNBProfit = apeWBNBResults.sell - pancakeWBNBResults.buy - txCost - apePaybackBUSDFee

      const apeToPancakeBUSDProfit = apeBUSDResults.sell - pancakeBUSDResults.buy - txCost - apePaybackWBNBFee

      const pancakeToApeWBNBProfit = pancakeWBNBResults.sell - apeWBNBResults.buy - txCost - pancakePaybackBUSDFee

      const pancakeToApeBUSDProfit = pancakeBUSDResults.sell - apeBUSDResults.buy - txCost - pancakePaybackWBNBFee

      //console.log(pancakeToApeBUSDProfit)

      if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
        console.log(`Expected Flashswap Cost ${pancakePaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${apeToPancakeWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
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
      if (pancakeToApeWBNBProfit > 0 && pancakeToApeWBNBProfit > apeToPancakeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Buy WBNB from Pancakeswap at ${pancakeWBNBResults.buy} `);
        console.log(`Sell WBNB from ApeSwap at ${apeWBNBResults.sell}`);
        console.log(`Expected Flashswap Cost ${apePaybackBUSDFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${pancakeToApeWBNBProfit} BUSD`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount.toString(), //amount0
          0, //amount1
          mainnet.pancakeswap.factory.address, //pancakefactory
          mainnet.apeswap.router.address, // aperouter
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
      if (apeToPancakeBUSDProfit > 0 && apeToPancakeBUSDProfit > pancakeToApeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Apeswap at ${apeBUSDResults.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${pancakeBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${apePaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${apeToPancakeBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
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
      if (pancakeToApeBUSDProfit > 0 && pancakeToApeBUSDProfit > apeToPancakeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan BUSD on Pancakeswap at ${pancakeBUSDResults.buy} `);
        console.log(`Sell BUSD on Apeswap at ${apeBUSDResults.sell} `);
        console.log(`Expected Flashswap Cost ${apePaybackWBNBFee}`);
        console.log(`Estimated Gas Cost: ${txCost}`);
        console.log(`Expected profit: ${pancakeToApeBUSDProfit} WBNB`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount.toString(), //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.pancakeswap.router.address, //pancakerouter
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
        sleep(15000)
      }
    }
    setInterval(runLocalAritrage, 5000);
  } else {
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

        // get WBNB/BUSD on Apeswap
        const rawApeBUSDValue = await apeswap.router.methods
          .getAmountsOut(shiftedWBNBBorrowAmount,
            [tradingToken.address,
              stableToken.address])
          .call();
        let apeBUSDValueBN = await rawApeBUSDValue[1];


        // Set x Borrow Amount BNB / y BUSD Borrow Amount
        let shiftedBUSDBorrowAmount = pancakeBUSDValueBN;

        // get WBNB
        const rawPancakeWBNBValue = await pancakeswap.router.methods
          .getAmountsOut(shiftedBUSDBorrowAmount,
            [stableToken.address,
              tradingToken.address])
          .call();

        let pancakeWBNBValueBN = await rawPancakeWBNBValue[1];

        // get BUSD/WBNB on Apeswap
        const rawApeWBNBValue = await apeswap.router.methods
          .getAmountsOut(shiftedBUSDBorrowAmount,
            [stableToken.address,
              tradingToken.address])
          .call();
        const apeWBNBValueBN = await rawApeWBNBValue[1];

        let bUSDAmount = shiftedBUSDBorrowAmount;
        let wBNBAmount = pancakeWBNBValueBN;

        const apeWBNBResults = {
          buy: (bUSDAmount / apeBUSDValueBN) * wBNBAmount,
          sell: (apeWBNBValueBN / wBNBAmount) * wBNBAmount
        }

        const apeBUSDResults = {
          buy: (wBNBAmount / apeWBNBValueBN) * bUSDAmount,
          sell: (apeBUSDValueBN / bUSDAmount) * bUSDAmount
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

        const apeWBNBPrice = (Number(apeWBNBResults.buy) + Number(apeWBNBResults.sell)) / borrowAmount / 2
        const pancakeWBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / borrowAmount / 2

        const apePaybackCalcBUSD = (apeWBNBResults.buy / 0.997) * 10 ** 18;
        const apePaybackBUSD = apePaybackCalcBUSD.toString()
        const apePaybackBUSDFee = apePaybackCalcBUSD / 10 ** 18 - apeWBNBResults.buy;

        const apePaybackCalcWBNB = (apeBUSDResults.buy / 0.997) * 10 ** 18;
        const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).toString();
        const apePaybackWBNBFee = (apePaybackCalcWBNB / 10 ** 18  - apeBUSDResults.buy) * apeWBNBPrice;

        const pancakePaybackCalcBUSD = (pancakeWBNBResults.buy / 0.997) * 10 ** 18;
        const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).toString();
        const pancakePaybackBUSDFee = pancakePaybackCalcBUSD / 10 ** 18   - pancakeWBNBResults.buy;

        const pancakePaybackCalcWBNB = (pancakeBUSDResults.buy / 0.997) * 10 ** 18;
        const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).toString();
        const pancakePaybackWBNBFee = (pancakePaybackCalcWBNB / 10 ** 18  - pancakeBUSDResults.buy) * pancakeWBNBPrice;


        const gasPrice = await web3.eth.getGasPrice();
        const txCost = ((330000 * parseInt(gasPrice))/ 10 ** 18) * pancakeWBNBPrice;




        const apeToPancakeWBNBProfit = apeWBNBResults.sell - pancakeWBNBResults.buy - txCost - apePaybackBUSDFee

        const apeToPancakeBUSDProfit = apeBUSDResults.sell - pancakeBUSDResults.buy - txCost - apePaybackWBNBFee

        const pancakeToApeWBNBProfit = pancakeWBNBResults.sell - apeWBNBResults.buy - txCost - pancakePaybackBUSDFee

        const pancakeToApeBUSDProfit = pancakeBUSDResults.sell - apeBUSDResults.buy - txCost - pancakePaybackWBNBFee

        //console.log(pancakeToApeBUSDProfit)

        if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
          console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
          console.log(`Expected Flashswap Cost ${pancakePaybackBUSDFee}`);
          console.log(`Estimated Gas Cost: ${txCost}`);
          console.log(`Expected profit: ${apeToPancakeWBNBProfit} BUSD`);

          // let slippage = Number(0.02) * wBNBAmount;
          // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmount.toString(), //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
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
        if (pancakeToApeWBNBProfit > 0 && pancakeToApeWBNBProfit > apeToPancakeWBNBProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(`Buy WBNB from Pancakeswap at ${pancakeWBNBResults.buy} `);
          console.log(`Sell WBNB from ApeSwap at ${apeWBNBResults.sell}`);
          console.log(`Expected Flashswap Cost ${apePaybackBUSDFee}`);
          console.log(`Estimated Gas Cost: ${txCost}`);
          console.log(`Expected profit: ${pancakeToApeWBNBProfit} BUSD`);

          // let slippage = Number(0.02) * wBNBAmount;
          // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmount.toString(), //amount0
            0, //amount1
            mainnet.pancakeswap.factory.address, //pancakefactory
            mainnet.apeswap.router.address, // aperouter
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
        if (apeToPancakeBUSDProfit > 0 && apeToPancakeBUSDProfit > pancakeToApeBUSDProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(`Flashloan BUSD on Apeswap at ${apeBUSDResults.buy} `);
          console.log(`Sell BUSD on PancakeSwap at ${pancakeBUSDResults.sell} `);
          console.log(`Expected Flashswap Cost ${apePaybackWBNBFee}`);
          console.log(`Estimated Gas Cost: ${txCost}`);
          console.log(`Expected profit: ${apeToPancakeBUSDProfit} WBNB`);

          // let slippage = Number(0.02) * bUSDAmount;
          // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmount.toString(), //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
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
        if (pancakeToApeBUSDProfit > 0 && pancakeToApeBUSDProfit > apeToPancakeBUSDProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(`Flashloan BUSD on Pancakeswap at ${pancakeBUSDResults.buy} `);
          console.log(`Sell BUSD on Apeswap at ${apeBUSDResults.sell} `);
          console.log(`Expected Flashswap Cost ${apePaybackWBNBFee}`);
          console.log(`Estimated Gas Cost: ${txCost}`);
          console.log(`Expected profit: ${pancakeToApeBUSDProfit} WBNB`);

          // let slippage = Number(0.02) * bUSDAmount;
          // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmount.toString(), //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
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
          sleep(15000)
        }


      })
      .on('error', error => {
        console.log(error);
      });
  }





}