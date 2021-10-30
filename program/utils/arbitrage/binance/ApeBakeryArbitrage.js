require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {mainnet} = require('../../addresses')
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
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));
  const networkId = await web3.eth.net.getId();

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

  //let flashloan = new web3.eth.Contract(BakeryApeFlashloan.abi, BakeryApeFlashloan.networks[networkId].address);


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

      const shiftedApeBUSDValue = await new BigNumber(rawApeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const apeBUSDValueBN = await new BigNumber(rawApeBUSDValue[1]);



      // get WBNB/BUSD on Bakeryswap
      const rawBakeryBUSDValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();
      const shiftedBakeryBUSDValue = await new BigNumber(rawBakeryBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const bakeryBUSDValueBN = await new BigNumber(rawBakeryBUSDValue[1]);




      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      const bUSDBorrowAmount = (Number(shiftedBakeryBUSDValue.toString()));
      const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);




      // get WBNB
      const rawApeWBNBValue = await apeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const shiftedApeWBNBValue = await new BigNumber(rawApeWBNBValue[1])
        .shiftedBy(-tradingToken.decimals);
      const apeWBNBValueBN = await new BigNumber(rawApeWBNBValue[1]);



      // get BUSD/WBNB on Bakeryswap
      const rawBakeryWBNBValue = await bakeryswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const shiftedBakeryWBNBValue = await new BigNumber(rawBakeryWBNBValue[1])
        .shiftedBy(-tradingToken.decimals);
      const bakeryWBNBValueBN = await new BigNumber(rawBakeryWBNBValue[1]);


      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = apeWBNBValueBN;



      const bakeryWBNBResults = {
        buy: new BigNumber(((bUSDAmount / bakeryBUSDValueBN) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString(),
        sell: new BigNumber(((bakeryWBNBValueBN / wBNBAmount) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString()
      }

      const bakeryBUSDResults = {
        buy: new BigNumber(((wBNBAmount / bakeryWBNBValueBN) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString(),
        sell: new BigNumber(((bakeryBUSDValueBN / bUSDAmount) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString()
      }

      const apeWBNBResults = {
        buy: new BigNumber(((bUSDAmount / apeBUSDValueBN) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString(),
        sell: new BigNumber(((apeWBNBValueBN / wBNBAmount) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString()
      }

      const apeBUSDResults = {
        buy: new BigNumber(((wBNBAmount / apeWBNBValueBN) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString(),
        sell: new BigNumber(((apeBUSDValueBN / bUSDAmount) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString()
      }


      const bakeryPaybackCalcBUSD = (bakeryWBNBResults.buy * 1000) / 996;
      const bakeryPaybackBUSD = new BigNumber(bakeryPaybackCalcBUSD).shiftedBy(stableToken.decimals)
      const bakeryPaybackBUSDFee = bakeryPaybackCalcBUSD - bakeryWBNBResults.buy;

      const bakeryPaybackCalcWBNB = (bakeryBUSDResults.buy * 1000) / 996;
      const bakeryPaybackWBNB = new BigNumber(bakeryPaybackCalcWBNB).shiftedBy(tradingToken.decimals);
      const bakeryPaybackWBNBFee = bakeryPaybackCalcWBNB - bakeryBUSDResults.buy;

      const apePaybackCalcBUSD = (apeWBNBResults.buy * 1000) / 996;
      const apePaybackBUSD = new BigNumber(apePaybackCalcBUSD).shiftedBy(stableToken.decimals);
      const apePaybackBUSDFee = apePaybackCalcBUSD - apeWBNBResults.buy;

      const apePaybackCalcWBNB = (apeBUSDResults.buy * 1000) / 996;
      const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).shiftedBy(tradingToken.decimals);
      const apePaybackWBNBFee = apePaybackCalcWBNB - apeBUSDResults.buy;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = 330000 * parseInt(gasPrice);


      const currentBNBPrice = (Number(apeWBNBResults.buy) + Number(apeWBNBResults.sell)) / 2;

      const bakeryToApeWBNBProfit = new BigNumber(wBNBAmount * (Number(bakeryWBNBResults.sell) - Number(apeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackWBNBFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      const bakeryToApeBUSDProfit = new BigNumber(bUSDAmount * (Number(bakeryBUSDResults.sell) - Number(apeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(bakeryPaybackBUSDFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const apeToBakeryWBNBProfit = new BigNumber(wBNBAmount * (Number(apeWBNBResults.sell) - Number(bakeryWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const apeToBakeryBUSDProfit = new BigNumber(bUSDAmount * (Number(apeBUSDResults.sell) - Number(bakeryBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      console.log(apeToBakeryBUSDProfit)

      if (bakeryToApeWBNBProfit > 0 && bakeryToApeWBNBProfit > apeToBakeryWBNBProfit) {
        console.log("Arb opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan WBNB on Bakeryswap at ${bakeryWBNBResults.buy} `);
        console.log(`Sell WBNB on Apeswap at ${apeWBNBResults.sell} `);
        console.log(`Expected profit: ${bakeryToApeWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.bakerySwap.factory, //bakeryfactory
        //   addresses.apeSwap.router, //aperouter
        //   apePaybackBusd.toString()
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
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Buy WBNB from Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB from BakerySwap at ${bakeryWBNBResults.sell}`);
        console.log(`Expected profit: ${apeToBakeryWBNBProfit} WBNB`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.WBNB, //token1
        //   addresses.tokens.BUSD, //token2
        //   amountInWBNB.toString(), //amount0
        //   0, //amount1
        //   addresses.apeSwap.factory, //apefactory
        //   addresses.bakerySwap.router, // bakeryrouter
        //   bakerySwapPaybackBusd.toString()
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
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Bakeryswap at ${bakeryBUSDResults.buy} `);
        console.log(`Sell BUSD on ApeSwap at ${apeBUSDResults.sell} `);
        console.log(`Expected profit: ${bakeryToApeBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.bakerySwap.factory, //bakeryfactory
        //   addresses.apeSwap.router, //aperouter
        //   apePaybackWbnb.toString()
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
      if (apeToBakeryBUSDProfit > 0 && apeToBakeryBUSDProfit > bakeryToApeBUSDProfit) {
        console.log("Arb opportunity found!");
        console.log(pad(colors.yellow('Current Time:'), 30),
          moment().format('ll') + ' ' + moment().format('LTS'));
        console.log(`Flashloan BUSD on Apeswap at ${apeBUSDResults.buy} `);
        console.log(`Sell BUSD on Bakeryswap at ${bakeryBUSDResults.sell} `);
        console.log(`Expected profit: ${apeToBakeryBUSDProfit} BUSD`);

        // let tx = flashloan.methods.startArbitrage(
        //   addresses.tokens.BUSD, //token1
        //   addresses.tokens.WBNB, //token2
        //   amountInBUSD.toString(), //amount0
        //   0, //amount1
        //   addresses.bakerySwap.factory, //bakeryfactory
        //   addresses.apeSwap.router, //aperouter
        //   bakerySwapPaybackWbnb.toString()
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
