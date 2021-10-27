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

  const apeswap = {
    factory: new web3.eth.Contract(mainnet.apeswap.factory.ABI, mainnet.apeswap.factory.address),
    router: new web3.eth.Contract(mainnet.apeswap.router.ABI, mainnet.apeswap.router.address),
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

  //let flashloan = new web3.eth.Contract(ApePancakeFlashloan.abi, ApePancakeFlashloan.networks[networkId].address);


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


      // get WBNB/BUSD on Apeswap
      const rawApeWBNBValue = await apeswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedApeWBNBValue = await new BigNumber(rawApeWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const apeWBNBValueBN = await new BigNumber(rawApeWBNBValue[1]);


      // get WBNB/BUSD on Pancake
      const rawPancakeWBNBValue = await pancakeswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedPancakeWBNBValue = await new BigNumber(rawPancakeWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const pancakeWBNBValueBN = await new BigNumber(rawPancakeWBNBValue[1]);

      // Set  x Borrow Amount BNB / y BUSD Borrow Amount
      const bUSDBorrowAmount = Math.round(borrowAmount * shiftedApeWBNBValue.toString());
      const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);


      // get BUSD/WBNB on Apeswap
      const rawApeBUSDValue = await apeswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedApeBUSDValue = await new BigNumber(rawApeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const apeBUSDValueBN = await new BigNumber(rawApeBUSDValue[1]);

      // get BUSD/WBNB on Pancakeswap
      const rawPancakeBUSDValue = await pancakeswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedPancakeBUSDValue = await new BigNumber(rawPancakeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const pancakeBUSDValueBN = await new BigNumber(rawPancakeBUSDValue[1]);

      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = shiftedWBNBBorrowAmount;


      const apeBUSDResults = {
        buy: new BigNumber(((bUSDAmount / apeBUSDValueBN) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString(),
        sell: new BigNumber(((apeWBNBValueBN / wBNBAmount) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString()
      }

      const apeWBNBResults = {
        buy: new BigNumber(((wBNBAmount / apeWBNBValueBN) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString(),
        sell: new BigNumber(((apeBUSDValueBN / bUSDAmount) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString()
      }

      const pancakeBUSDResults = {
        buy: new BigNumber(((bUSDAmount / pancakeBUSDValueBN) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString(),
        sell: new BigNumber(((pancakeWBNBValueBN / wBNBAmount) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString()
      }
      const pancakeWBNBResults = {
        buy: new BigNumber(((wBNBAmount / pancakeWBNBValueBN) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString(),
        sell: new BigNumber(((pancakeBUSDValueBN / bUSDAmount) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString()
      }


      const apePaybackCalcBUSD = (apeBUSDResults.buy * 1000) / 996;
      const apePaybackBUSD = new BigNumber(apePaybackCalcBUSD).toString();
      const apePaybackBUSDFee = apePaybackCalcBUSD - apeBUSDResults.buy;

      const apePaybackCalcWBNB = (apeWBNBResults.buy * 1000) / 996;
      const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).toString();
      const apePaybackWBNBFee = apePaybackCalcWBNB - apeWBNBResults.buy;

      const pancakePaybackCalcBUSD = (pancakeBUSDResults.buy * 1000) / 996;
      const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).toString();
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeBUSDResults.buy;

      const pancakePaybackCalcWBNB = (pancakeWBNBResults.buy * 1000) / 996;
      const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).toString();
      const pancakePaybackWBNBFee = pancakePaybackCalcWBNB - pancakeWBNBResults.buy;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = 330000 * parseInt(gasPrice);


      const currentBNBPrice = (Number(apeWBNBResults.buy) + Number(apeWBNBResults.sell)) / 2;


      const apeToPancakeBUSDProfit = new BigNumber(wBNBAmount * (Number(apeBUSDResults.sell) - Number(pancakeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      const apeToPancakeWBNBProfit = new BigNumber(bUSDAmount * (Number(apeWBNBResults.sell) - Number(pancakeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const pancakeToApeWBNBProfit = new BigNumber(wBNBAmount * (Number(pancakeWBNBResults.sell) - Number(apeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const pancakeToApeBUSDProfit = new BigNumber(bUSDAmount * (Number(pancakeBUSDResults.sell) - Number(apeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      console.log(pancakeToApeBUSDProfit)

      if (apeToPancakeBUSDProfit > 0 && apeToPancakeBUSDProfit > pancakeToApeBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
        console.log(`Expected profit: ${apeToPancakeBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.apeSwap.factory, //apefactory
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

      if (pancakeToApeBUSDProfit > 0 && pancakeToApeBUSDProfit > apeToPancakeBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Buy WBNB from Pancakeswap at ${pancakeBUSDResults.buy} `);
        console.log(`Sell WBNB from ApeSwap at ${apeBUSDResults.sell}`);
        console.log(`Expected profit: ${pancakeToApeBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.pancakeSwap.factory, //pancakefactory
        //   addresses.apeSwap.router, // aperouter
        //   apeSwapPaybackBusd.toString()
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

      if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${pancakeWBNBResults.sell} `);
        console.log(`Expected profit: ${apeToPancakeWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.apeSwap.factory, //apefactory
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
      if (pancakeToApeWBNBProfit > 0 && pancakeToApeWBNBProfit > apeToPancakeWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Pancakeswap at ${pancakeBUSDResults.buy} `);
        console.log(`Sell BUSD on Apeswap at ${apeBUSDResults.sell} `);
        console.log(`Expected profit: ${pancakeToApeWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.apeSwap.factory, //apefactory
        //   addresses.pancakeSwap.router, //pancakerouter
        //   apeSwapPaybackWbnb.toString()
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
