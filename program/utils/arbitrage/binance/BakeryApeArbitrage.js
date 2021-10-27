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

  //let flashloan = new web3.eth.Contract(ApeBakeryFlashloan.abi, ApeBakeryFlashloan.networks[networkId].address);


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

    // get WBNB/BUSD on Bakeryswap
      const rawBakeryWBNBValue = await bakeryswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedBakeryWBNBValue = await new BigNumber(rawBakeryWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const bakeryWBNBValueBN = await new BigNumber(rawBakeryWBNBValue[1]);

      // get WBNB/BUSD on Apeswap
      const rawApeWBNBValue = await apeswap.router.methods.getAmountsOut(shiftedWBNBBorrowAmount, [tradingToken.address, stableToken.address]).call();
      const shiftedApeWBNBValue = await new BigNumber(rawApeWBNBValue[1]).shiftedBy(-tradingToken.decimals);
      const apeWBNBValueBN = await new BigNumber(rawApeWBNBValue[1]);

      // Set  x Borrow Amount BNB / y BUSD Borrow Amount
      const bUSDBorrowAmount = Math.round(borrowAmount * shiftedBakeryWBNBValue.toString());
      const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);

      // get BUSD/WBNB on Apeswap
      const rawApeBUSDValue = await apeswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedApeBUSDValue = await new BigNumber(rawApeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const apeBUSDValueBN = await new BigNumber(rawApeBUSDValue[1]);

      // get BUSD/WBNB on Bakeryswap
      const rawBakeryBUSDValue = await bakeryswap.router.methods.getAmountsOut(shiftedBUSDBorrowAmount, [stableToken.address, tradingToken.address]).call();
      const shiftedBakeryBUSDValue = await new BigNumber(rawBakeryBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const bakeryBUSDValueBN = await new BigNumber(rawBakeryBUSDValue[1]);

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

      const bakeryBUSDResults = {
        buy: new BigNumber(((bUSDAmount / bakeryBUSDValueBN) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString(),
        sell: new BigNumber(((bakeryWBNBValueBN / wBNBAmount) * wBNBAmount)).shiftedBy(-tradingToken.decimals).toString()
      }
      const bakeryWBNBResults = {
        buy: new BigNumber(((wBNBAmount / bakeryWBNBValueBN) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString(),
        sell: new BigNumber(((bakeryBUSDValueBN / bUSDAmount) * bUSDAmount)).shiftedBy(-stableToken.decimals).toString()
      }


      const apePaybackCalcBUSD = (apeBUSDResults.buy * 1000) / 996;
      const apePaybackBUSD = new BigNumber(apePaybackCalcBUSD).toString();
      const apePaybackBUSDFee = apePaybackCalcBUSD - apeBUSDResults.buy;

      const apePaybackCalcWBNB = (apeWBNBResults.buy * 1000) / 996;
      const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).toString();
      const apePaybackWBNBFee = apePaybackCalcWBNB - apeWBNBResults.buy;

      const bakeryPaybackCalcBUSD = (bakeryBUSDResults.buy * 1000) / 996;
      const bakeryPaybackBUSD = new BigNumber(bakeryPaybackCalcBUSD).toString();
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD - bakeryBUSDResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryWBNBResults.buy * 1000) / 996;
      const bakeryPaybackWBNB = new BigNumber(bakeryPaybackCalcWBNB).toString();
      const bakeryPaybackWBNBFee = bakeryPaybackCalcWBNB - bakeryWBNBResults.buy;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = 330000 * parseInt(gasPrice);


      const currentBNBPrice = (Number(bakeryWBNBResults.buy) + Number(bakeryWBNBResults.sell)) / 2;


      const apeToBakeryBUSDProfit = new BigNumber(wBNBAmount * (Number(apeBUSDResults.sell) - Number(bakeryBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      const apeToBakeryWBNBProfit = new BigNumber(bUSDAmount * (Number(apeWBNBResults.sell) - Number(bakeryWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const bakeryToApeWBNBProfit = new BigNumber(wBNBAmount * (Number(bakeryWBNBResults.sell) - Number(apeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const bakeryToApeBUSDProfit = new BigNumber(bUSDAmount * (Number(bakeryBUSDResults.sell) - Number(apeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      console.log(bakeryToApeBUSDProfit)

      if (apeToBakeryBUSDProfit > 0 && apeToBakeryBUSDProfit > bakeryToApeBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB on Bakeryswap at ${bakeryWBNBResults.sell} `);
        console.log(`Expected profit: ${apeToBakeryBUSDProfit} BUSD`);

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

      if (bakeryToApeBUSDProfit > 0 && bakeryToApeBUSDProfit > apeToBakeryBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(`Buy WBNB from Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell WBNB from ApeSwap at ${apeBUSDResults.sell}`);
        console.log(`Expected profit: ${bakeryToApeBUSDProfit} BUSD`);

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

      if (apeToBakeryWBNBProfit > 0 && apeToBakeryWBNBProfit > bakeryToApeWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${bakeryWBNBResults.sell} `);
        console.log(`Expected profit: ${apeToBakeryWBNBProfit} WBNB`);

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
      if (bakeryToApeWBNBProfit > 0 && bakeryToApeWBNBProfit > apeToBakeryWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan BUSD on Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell BUSD on Apeswap at ${apeBUSDResults.sell} `);
        console.log(`Expected profit: ${bakeryToApeWBNBProfit} WBNB`);

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
