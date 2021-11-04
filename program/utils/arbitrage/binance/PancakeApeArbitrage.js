require('dotenv').config();
const Web3 = require('web3');
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
  const oneWei = ( 10 ** 18 );

  const admin  = Web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
  let web3, networkId, flashloan;

  if(data.network === 'Local'){
    web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
     flashloan = new web3.eth.Contract(PancakeApeFlashloan.abi, PancakeApeFlashloan.networks[56].address);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
     networkId = await web3.eth.net.getId();
     flashloan = new web3.eth.Contract(PancakeApeFlashloan.abi, PancakeApeFlashloan.networks[networkId].address);
  }

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
        let wBNBAmount = shiftedWBNBBorrowAmount;

        const apeBUSDResults = {
          buy: (bUSDAmount / apeWBNBValueBN) * wBNBAmount,
          sell: (apeBUSDValueBN / wBNBAmount) * wBNBAmount
        }

        const apeWBNBResults = {
          buy: (wBNBAmount / apeBUSDValueBN) * bUSDAmount,
          sell: (apeWBNBValueBN / bUSDAmount) * bUSDAmount
        }

        const pancakeBUSDResults = {
          buy: (bUSDAmount / pancakeWBNBValueBN) * wBNBAmount,
          sell: (pancakeBUSDValueBN / wBNBAmount) * wBNBAmount
        }

        const pancakeWBNBResults = {
          buy: (wBNBAmount / pancakeBUSDValueBN) * bUSDAmount,
          sell: (pancakeWBNBValueBN / bUSDAmount) * bUSDAmount
        }

        const apeWBNBPrice = (apeWBNBResults.buy + apeWBNBResults.sell) / borrowAmount / 2
        const pancakeWBNBPrice = (pancakeWBNBResults.buy + pancakeWBNBResults.sell) / borrowAmount / 2


        const apePaybackCalcBUSD = (apeBUSDResults.buy / 0.997);
        const apePaybackBUSD = apePaybackCalcBUSD.toString()
        const apePaybackBUSDFee = apePaybackCalcBUSD  - apeBUSDResults.buy;


        const apePaybackCalcWBNB = (apeWBNBResults.buy / 0.997);
        const apePaybackWBNB = apePaybackCalcWBNB.toString();
        const apePaybackWBNBFee = (apePaybackCalcWBNB  - apeWBNBResults.buy);

        const pancakePaybackCalcBUSD = (pancakeBUSDResults.buy / 0.997);
        const pancakePaybackBUSD = pancakePaybackCalcBUSD.toString();
        const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeBUSDResults.buy;

        const pancakePaybackCalcWBNB = (pancakeWBNBResults.buy / 0.997);
        const pancakePaybackWBNB = pancakePaybackCalcWBNB.toString();
        const pancakePaybackWBNBFee = (pancakePaybackCalcWBNB - pancakeWBNBResults.buy);

        const gasPrice = await web3.eth.getGasPrice();
        const txCost = ((330000 * parseInt(gasPrice))) ;


        const apeToPancakeWBNBProfit = ((apeWBNBResults.buy - pancakeWBNBResults.sell - txCost - apePaybackWBNBFee) / oneWei)
        const apeToPancakeBUSDProfit = ((apeBUSDResults.buy - pancakeBUSDResults.sell - txCost - apePaybackBUSDFee) / oneWei)
        const pancakeToApeWBNBProfit = ((pancakeWBNBResults.buy - apeWBNBResults.sell - txCost - pancakePaybackWBNBFee) / oneWei)
        const pancakeToApeBUSDProfit = ((pancakeBUSDResults.buy - apeBUSDResults.sell - txCost - pancakePaybackBUSDFee) / oneWei)
    
       
        if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan WBNB on Apeswap at ${((apeWBNBResults.buy) / oneWei)} `);
          console.log(`Sell WBNB on Pancakeswap at ${((pancakeWBNBResults.sell) / oneWei)} `);
          console.log(`Expected Flashswap Cost ${((pancakePaybackBUSDFee) / oneWei)}`);
          console.log(`Estimated Gas Cost: ${((txCost) / oneWei)}`);
          console.log(`Expected profit: ${apeToPancakeWBNBProfit} WBNB`);

          // let slippage = Number(0.02) * wBNBAmount;
          // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmount, //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
            pancakePaybackCalcBUSD
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
        if (pancakeToApeWBNBProfit > 0 && pancakeToApeWBNBProfit > apeToPancakeWBNBProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Buy WBNB from Pancakeswap at ${((pancakeWBNBResults.buy) / oneWei)} `);
          console.log(`Sell WBNB from ApeSwap at ${((apeWBNBResults.sell) / oneWei)}`);
          console.log(`Expected Flashswap Cost ${((apePaybackBUSDFee) / oneWei)}`);
          console.log(`Estimated Gas Cost: ${((txCost) / oneWei)}`);
          console.log(`Expected profit: ${pancakeToApeWBNBProfit} WBNB`);

          // let slippage = Number(0.02) * wBNBAmount;
          // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmount, //amount0
            0, //amount1
            mainnet.pancakeswap.factory.address, //pancakefactory
            mainnet.apeswap.router.address, // aperouter
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
        if (apeToPancakeBUSDProfit > 0 && apeToPancakeBUSDProfit > pancakeToApeBUSDProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan BUSD on Apeswap at ${((apeBUSDResults.buy) / oneWei)} `);
          console.log(`Sell BUSD on PancakeSwap at ${((pancakeBUSDResults.sell) / oneWei)} `);
          console.log(`Expected Flashswap Cost ${((apePaybackWBNBFee) / oneWei)}`);
          console.log(`Estimated Gas Cost: ${((txCost) / oneWei)}`);
          console.log(`Expected profit: ${apeToPancakeBUSDProfit} BUSD`);

          // let slippage = Number(0.02) * bUSDAmount;
          // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmount, //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
            pancakePaybackCalcWBNB
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
        if (pancakeToApeBUSDProfit > 0 && pancakeToApeBUSDProfit > apeToPancakeBUSDProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan BUSD on Pancakeswap at ${((pancakeBUSDResults.buy) / oneWei)} `);
          console.log(`Sell BUSD on Apeswap at ${((apeBUSDResults.sell) / oneWei)} `);
          console.log(`Expected Flashswap Cost ${((apePaybackWBNBFee) / oneWei)}`);
          console.log(`Estimated Gas Cost: ${((txCost) / oneWei)}`);
          console.log(`Expected profit: ${pancakeToApeBUSDProfit} BUSD`);

          // let slippage = Number(0.02) * bUSDAmount;
          // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmount, //amount0
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
          await sleep(15000)
        }


      })
      .on('error', error => {
        console.log(error);
      });





}