require('dotenv').config();
const Web3 = require('web3');
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

  const oneWei = ( 10 ** 18 );

  let admin, web3, networkId, flashloan;
  
  if(data.network === 'Local'){
    web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
    admin  = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
    flashloan = new web3.eth.Contract(PancakeBakeryFlashloan.abi, PancakeBakeryFlashloan.networks[56].address);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
    admin  = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
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
      let wBNBAmount = shiftedWBNBBorrowAmount;

      const bakeryBUSDResults = {
        buy: (bUSDAmount / bakeryWBNBValueBN) * wBNBAmount,
        sell: (bakeryBUSDValueBN / wBNBAmount) * wBNBAmount
      }

      const bakeryWBNBResults = {
        buy: (wBNBAmount / bakeryBUSDValueBN) * bUSDAmount,
        sell: (bakeryWBNBValueBN / bUSDAmount) * bUSDAmount
      }

      const pancakeBUSDResults = {
        buy: (bUSDAmount / pancakeWBNBValueBN) * wBNBAmount,
        sell: (pancakeBUSDValueBN / wBNBAmount) * wBNBAmount
      }

      const pancakeWBNBResults = {
        buy: (wBNBAmount / pancakeBUSDValueBN) * bUSDAmount,
        sell: (pancakeWBNBValueBN / bUSDAmount) * bUSDAmount
      }

      const bakeryWBNBPrice = (bakeryWBNBResults.buy + bakeryWBNBResults.sell) / borrowAmount / 2
      const pancakeWBNBPrice = (pancakeWBNBResults.buy + pancakeWBNBResults.sell) / borrowAmount / 2

      const bakeryPaybackCalcBUSD = (bakeryBUSDResults.buy / 0.997);
      const bakeryPaybackBUSD = bakeryPaybackCalcBUSD.toString()
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD  - bakeryBUSDResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryWBNBResults.buy / 0.997);
      const bakeryPaybackWBNB = bakeryPaybackCalcWBNB.toString();
      const bakeryPaybackWBNBFee = (bakeryPaybackCalcWBNB  - bakeryWBNBResults.buy);

      const pancakePaybackCalcBUSD = (pancakeBUSDResults.buy / 0.997);
      const pancakePaybackBUSD = pancakePaybackCalcBUSD.toString();
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeBUSDResults.buy;

      const pancakePaybackCalcWBNB = (pancakeWBNBResults.buy / 0.997);
      const pancakePaybackWBNB = pancakePaybackCalcWBNB.toString();
      const pancakePaybackWBNBFee = (pancakePaybackCalcWBNB - pancakeWBNBResults.buy);

      const gasPrice = await web3.eth.getGasPrice();
      const txCost = ((330000 * parseInt(gasPrice))) ;


      const bakeryToPancakeWBNBProfit = ((bakeryWBNBResults.buy - pancakeWBNBResults.sell - txCost - bakeryPaybackWBNBFee) / oneWei)
      const bakeryToPancakeBUSDProfit = ((bakeryBUSDResults.buy - pancakeBUSDResults.sell - txCost - bakeryPaybackBUSDFee) / oneWei)
      const pancakeToBakeryWBNBProfit = ((pancakeWBNBResults.buy - bakeryWBNBResults.sell - txCost - pancakePaybackWBNBFee) / oneWei)
      const pancakeToBakeryBUSDProfit = ((pancakeBUSDResults.buy - bakeryBUSDResults.sell - txCost - pancakePaybackBUSDFee) / oneWei)


      if (bakeryToPancakeWBNBProfit > 0 && bakeryToPancakeWBNBProfit > pancakeToBakeryWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan WBNB on Bakeryswap at ${((bakeryWBNBResults.buy) / oneWei)} `);
        console.log(`Sell WBNB on Pancakeswap at ${((pancakeWBNBResults.sell) / oneWei)} `);
        console.log(`Expected Flashswap Cost ${((pancakePaybackBUSDFee) / oneWei)} USD`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${bakeryToPancakeWBNBProfit} WBNB`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
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
      if (pancakeToBakeryWBNBProfit > 0 && pancakeToBakeryWBNBProfit > bakeryToPancakeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Buy WBNB from Pancakeswap at ${((pancakeWBNBResults.buy) / oneWei)} `);
        console.log(`Sell WBNB from BakerySwap at ${((bakeryWBNBResults.sell) / oneWei)}`);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackBUSDFee) / oneWei)} USD`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${pancakeToBakeryWBNBProfit} WBNB`);

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.pancakeswap.factory.address, //pancakefactory
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
      if (bakeryToPancakeBUSDProfit > 0 && bakeryToPancakeBUSDProfit > pancakeToBakeryBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Bakeryswap at ${((bakeryBUSDResults.buy) / oneWei)} `);
        console.log(`Sell BUSD on PancakeSwap at ${((pancakeBUSDResults.sell) / oneWei)} `);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackWBNBFee) / oneWei)} WBNB`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${bakeryToPancakeBUSDProfit} BUSD`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
          0, //amount1
          mainnet.bakeryswap.factory.address, //bakeryfactory
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
      if (pancakeToBakeryBUSDProfit > 0 && pancakeToBakeryBUSDProfit > bakeryToPancakeBUSDProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Pancakeswap at ${((pancakeBUSDResults.buy) / oneWei)} `);
        console.log(`Sell BUSD on Bakeryswap at ${((bakeryBUSDResults.sell) / oneWei)} `);
        console.log(`Expected Flashswap Cost ${((bakeryPaybackWBNBFee) / oneWei)} WBNB`);
        console.log(`Estimated Gas Cost: ${((txCost) / oneWei)} BNB`);
        console.log(`Expected profit: ${pancakeToBakeryBUSDProfit} BUSD`);

        // let slippage = Number(0.02) * bUSDAmount;
        // let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
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
        await sleep(15000)
      }


    })
    .on('error', error => {
      console.log(error);
    });
}
