require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {mainnet} = require('../../addresses')



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
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
  const networkId = await web3.eth.net.getId();

  const pancakeswap = {
    factory: new web3.eth.Contract(mainnet.pancakeswap.factory.ABI, mainnet.pancakeswap.factory.address),
    router: new web3.eth.Contract(mainnet.pancakeswap.router.ABI, mainnet.pancakeswap.router.address),
  }
  const bakeryswap = {
    factory: new web3.eth.Contract(mainnet.bakeryswap.factory.ABI, mainnet.bakeryswap.factory.address),
    router: new web3.eth.Contract(mainnet.bakeryswap.router.ABI, mainnet.bakeryswap.router.address),
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

  //let flashloan = new web3.eth.Contract(PancakeBakeryFlashloan.abi, PancakeBakeryFlashloan.networks[networkId].address);


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

      const wBNBborrowAmount =  new BigNumber(borrowAmount);
      const shiftedWBNBBorrowAmount =  new BigNumber(wBNBborrowAmount).shiftedBy(tradingToken.decimals);

      // get WBNB/BUSD on Pancakeswap
      const rawPancakeWBNBValue = await pancakeswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedPancakeWBNBValue = await new BigNumber(rawPancakeWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const pancakeWBNBValueBN = await new BigNumber(rawPancakeWBNBValue[1]);

      // get WBNB/BUSD on Bakeryswap
      const rawBakeryWBNBValue = await bakeryswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedBakeryWBNBValue = await new BigNumber(rawBakeryWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const bakeryWBNBValueBN = await new BigNumber(rawBakeryWBNBValue[1]);

      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      const bUSDBorrowAmount = Math.round(borrowAmount * shiftedPancakeWBNBValue.toString());
      const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);

      // get BUSD/WBNB on Pancakeswap
      const rawPancakeBUSDValue = await pancakeswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedPancakeBUSDValue = await new BigNumber(rawPancakeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const pancakeBUSDValueBN = await new BigNumber(rawPancakeBUSDValue[1]);

      // get BUSD/WBNB on Bakeryswap
      const rawBakeryBUSDValue = await bakeryswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedBakeryBUSDValue = await new BigNumber(rawBakeryBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const bakeryBUSDValueBN = await new BigNumber(rawBakeryBUSDValue[1]);

      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = shiftedWBNBBorrowAmount;


      const pancakeBUSDResults = {
        buy: new BigNumber(((bUSDAmount / pancakeBUSDValueBN) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString(),
        sell: new BigNumber(((pancakeWBNBValueBN / wBNBAmount) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString()
      }

      const pancakeWBNBResults = {
        buy: new BigNumber(((wBNBAmount / pancakeWBNBValueBN) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString(),
        sell: new BigNumber(((pancakeBUSDValueBN / bUSDAmount) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString()
      }

      const bakeryBUSDResults = {
        buy: new BigNumber(((bUSDAmount / bakeryBUSDValueBN) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString(),
        sell: new BigNumber(((bakeryWBNBValueBN / wBNBAmount) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString()
      }
      const bakeryWBNBResults = {
        buy: new BigNumber(((wBNBAmount / bakeryWBNBValueBN) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString(),
        sell: new BigNumber(((bakeryBUSDValueBN / bUSDAmount) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString()
      }


      const pancakePaybackCalcBUSD = (pancakeBUSDResults.buy * 1000) / 996;
      const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).toString();
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeBUSDResults.buy;

      const pancakePaybackCalcWBNB = (pancakeWBNBResults.buy * 1000) / 996;
      const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).toString();
      const pancakePaybackWBNBFee = pancakePaybackCalcWBNB - pancakeWBNBResults.buy;

      const bakeryPaybackCalcBUSD = (bakeryBUSDResults.buy * 1000) / 996;
      const bakeryPaybackBUSD = new BigNumber(bakeryPaybackCalcBUSD).toString();
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD - bakeryBUSDResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryWBNBResults.buy * 1000) / 996;
      const bakeryPaybackWBNB = new BigNumber(bakeryPaybackCalcWBNB).toString();
      const bakeryPaybackWBNBFee = bakeryPaybackCalcWBNB - bakeryWBNBResults.buy;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = 330000 * parseInt(gasPrice);


      const currentBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / 2;


      const pancakeToBakeryBUSDProfit = new BigNumber(wBNBAmount * (Number(pancakeBUSDResults.sell) - Number(bakeryBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      const pancakeToBakeryWBNBProfit = new BigNumber(bUSDAmount * (Number(pancakeWBNBResults.sell) - Number(bakeryWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const bakeryToPancakeWBNBProfit = new BigNumber(wBNBAmount * (Number(bakeryWBNBResults.sell) - Number(pancakeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const bakeryToPancakeBUSDProfit = new BigNumber(bUSDAmount * (Number(bakeryBUSDResults.sell) - Number(pancakeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();


      if (pancakeToBakeryBUSDProfit > 0 && pancakeToBakeryBUSDProfit > bakeryToPancakeBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan WBNB on Pancakeswap at ${pancakeWBNBResults.buy} `);
        console.log(`Sell WBNB on Bakeryswap at ${bakeryWBNBResults.sell} `);
        console.log(`Expected profit: ${pancakeToBakeryBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.pancakeSwap.factory, //pancakefactory
        //   addresses.pancakeSwap.router, //pancakerouter
        //   pancakePaybackBusd.toString()
        // );
        //
        // const data = tx.encodeABI();
        // const txData = {
        //   from: admin,
        //   to: flashloan.options.address,
        //   data,
        //   gas: "330000",
        //   gasPrice: gasPrice,
        // };
        // const receipt = await web3.eth.sendTransaction(txData);
        // console.log(`Transaction hash: ${receipt.transactionHash}`);
        // console.log("Waiting a block as to not redo transaction in same block");
        sleep(3000);
      }

      if (bakeryToPancakeBUSDProfit > 0 && bakeryToPancakeBUSDProfit > pancakeToBakeryBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Buy WBNB from Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell WBNB from PancakeSwap at ${pancakeBUSDResults.sell}`);
        console.log(`Expected profit: ${bakeryToPancakeBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.pancakeSwap.factory, //pancakefactory
        //   addresses.pancakeSwap.router, // pancakerouter
        //   pancakeSwapPaybackBusd.toString()
        // );
        //
        // const data = tx.encodeABI();
        // const txData = {
        //   from: admin,
        //   to: flashloan.options.address,
        //   data,
        //   gas: "330000",
        //   gasPrice: gasPrice,
        // };
        // const receipt = await web3.eth.sendTransaction(txData);
        // console.log(`Transaction hash: ${receipt.transactionHash}`);
        // console.log("Waiting a block as to not redo transaction in same block");
        sleep(3000);
      }

      if (pancakeToBakeryWBNBProfit > 0 && pancakeToBakeryWBNBProfit > bakeryToPancakeWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Pancakeswap at ${pancakeWBNBResults.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${bakeryWBNBResults.sell} `);
        console.log(`Expected profit: ${pancakeToBakeryWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.pancakeSwap.factory, //pancakefactory
        //   addresses.pancakeSwap.router, //pancakerouter
        //   pancakePaybackWbnb.toString()
        // );
        //
        // const data = tx.encodeABI();
        // const txData = {
        //   from: admin,
        //   to: flashloan.options.address,
        //   data,
        //   gas: "330000",
        //   gasPrice: gasPrice,
        // };
        // const receipt = await web3.eth.sendTransaction(txData);
        // console.log(`Transaction hash: ${receipt.transactionHash}`);
        // console.log("Waiting a block as to not redo transaction in same block");
        sleep(3000);
      }
      if (bakeryToPancakeWBNBProfit > 0 && bakeryToPancakeWBNBProfit > pancakeToBakeryWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell BUSD on Pancakeswap at ${pancakeBUSDResults.sell} `);
        console.log(`Expected profit: ${bakeryToPancakeWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.pancakeSwap.factory, //pancakefactory
        //   addresses.pancakeSwap.router, //pancakerouter
        //   pancakeSwapPaybackWbnb.toString()
        // );
        //
        // const data = tx.encodeABI();
        // const txData = {
        //   from: admin,
        //   to: flashloan.options.address,
        //   data,
        //   gas: "330000",
        //   gasPrice: gasPrice,
        // };
        // const receipt = await web3.eth.sendTransaction(txData);
        // console.log(`Transaction hash: ${receipt.transactionHash}`);
        // console.log("Waiting a block as to not redo transaction in same block");
        sleep(3000);
      }


    })
    .on('error', error => {
      console.log(error);
    });
}
