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

      const shiftedPancakeBUSDValue = await new BigNumber(rawPancakeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const pancakeBUSDValueBN = await new BigNumber(rawPancakeBUSDValue[1]);



      // get WBNB/BUSD on Apeswap
      const rawApeBUSDValue = await apeswap.router.methods
        .getAmountsOut(shiftedWBNBBorrowAmount,
          [tradingToken.address,
            stableToken.address])
        .call();
      const shiftedApeBUSDValue = await new BigNumber(rawApeBUSDValue[1]).shiftedBy(-stableToken.decimals);
      const apeBUSDValueBN = await new BigNumber(rawApeBUSDValue[1]);




      // Set x Borrow Amount BNB / y BUSD Borrow Amount
      const bUSDBorrowAmount = (Number(shiftedApeBUSDValue.toString()));
      const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);




      // get WBNB
      const rawPancakeWBNBValue = await pancakeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const shiftedPancakeWBNBValue = await new BigNumber(rawPancakeWBNBValue[1])
        .shiftedBy(-tradingToken.decimals);
      const pancakeWBNBValueBN = await new BigNumber(rawPancakeWBNBValue[1]);



      // get BUSD/WBNB on Apeswap
      const rawApeWBNBValue = await apeswap.router.methods
        .getAmountsOut(shiftedBUSDBorrowAmount,
          [stableToken.address,
            tradingToken.address])
        .call();
      const shiftedApeWBNBValue = await new BigNumber(rawApeWBNBValue[1])
        .shiftedBy(-tradingToken.decimals);
      const apeWBNBValueBN = await new BigNumber(rawApeWBNBValue[1]);


      let bUSDAmount = shiftedBUSDBorrowAmount;
      let wBNBAmount = pancakeWBNBValueBN;

      // let slippage = Number(0.02) * wBNBAmount;
      // let wBNBAmountMinusSlippage = wBNBAmount - slippage;
      // console.log(
      //   {
      //     wBNBAmount:wBNBAmount.toString(),
      //     slippage:slippage,
      //     percentage: '0.1',
      //     wBNBAmountMinusSlippage:wBNBAmountMinusSlippage.toString()
      //   }
      // )

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

      const pancakeWBNBResults = {
        buy: new BigNumber(((bUSDAmount / pancakeBUSDValueBN) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString(),
        sell: new BigNumber(((pancakeWBNBValueBN / wBNBAmount) * wBNBAmount))
          .shiftedBy(-tradingToken.decimals)
          .toString()
      }

      const pancakeBUSDResults = {
        buy: new BigNumber(((wBNBAmount / pancakeWBNBValueBN) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString(),
        sell: new BigNumber(((pancakeBUSDValueBN / bUSDAmount) * bUSDAmount))
          .shiftedBy(-stableToken.decimals)
          .toString()
      }

      console.log(pancakeWBNBResults, pancakeBUSDResults)


      const apePaybackCalcBUSD = (apeWBNBResults.buy * 1000) / 996;
      const apePaybackBUSD = new BigNumber(apePaybackCalcBUSD).shiftedBy(stableToken.decimals);
      const apePaybackBUSDFee = apePaybackCalcBUSD - apeWBNBResults.buy;

      const apePaybackCalcWBNB = (apeBUSDResults.buy * 1000) / 996;
      const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).shiftedBy(tradingToken.decimals);
      const apePaybackWBNBFee = apePaybackCalcWBNB - apeBUSDResults.buy;

      const pancakePaybackCalcBUSD = (pancakeWBNBResults.buy * 1000) / 996;
      const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).shiftedBy(stableToken.decimals);
      const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeWBNBResults.buy;

      const pancakePaybackCalcWBNB = (pancakeBUSDResults.buy * 1000) / 996;
      const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).shiftedBy(tradingToken.decimals);
      const pancakePaybackWBNBFee = pancakePaybackCalcWBNB - pancakeBUSDResults.buy;


      const gasPrice = await web3.eth.getGasPrice();
      const txCost = 330000 * parseInt(gasPrice);


      const currentBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / 2;

      const apeToPancakeWBNBProfit = new BigNumber(wBNBAmount * (Number(apeWBNBResults.sell) - Number(pancakeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackWBNBFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      const apeToPancakeBUSDProfit = new BigNumber(bUSDAmount * (Number(apeBUSDResults.sell) - Number(pancakeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackBUSDFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const pancakeToApeWBNBProfit = new BigNumber(wBNBAmount * (Number(pancakeWBNBResults.sell) - Number(apeWBNBResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackWBNBFee)))
        .shiftedBy(-stableToken.decimals).toString();

      const pancakeToApeBUSDProfit = new BigNumber(bUSDAmount * (Number(pancakeBUSDResults.sell) - Number(apeBUSDResults.buy))
        - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackBUSDFee)))
        .shiftedBy(-tradingToken.decimals).toString();

      //console.log(pancakeToApeBUSDProfit)

      if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
        console.log("Arbitrage opportunity found!");
        console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
        console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
        console.log(`Expected profit: ${apeToPancakeWBNBProfit} WBNB`);

        let slippage = Number(0.02) * wBNBAmount;
        let wBNBAmountMinusSlippage = wBNBAmount - slippage;
        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.pancakeswap.router.address, //pancakerouter
          pancakePaybackBUSD
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
        console.log(`Expected profit: ${pancakeToApeWBNBProfit} WBNB`);

        let slippage = Number(0.02) * wBNBAmount;
        let wBNBAmountMinusSlippage = wBNBAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          tradingToken.address, //token1
          stableToken.address, //token2
          wBNBAmount, //amount0
          0, //amount1
          mainnet.pancakeswap.factory.address, //pancakefactory
          mainnet.apeswap.router.address, // aperouter
          apePaybackBUSD.toString()
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
        console.log(`Expected profit: ${apeToPancakeBUSDProfit} BUSD`);

        let slippage = Number(0.02) * bUSDAmount;
        let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.pancakeswap.router.address, //pancakerouter
          pancakePaybackWBNB.toString()
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
        console.log(`Expected profit: ${pancakeToApeBUSDProfit} BUSD`);

        let slippage = Number(0.02) * bUSDAmount;
        let bUSDAmountMinusSlippage = bUSDAmount - slippage;

        let tx = flashloan.methods.startArbitrage(
          stableToken.address, //token1
          tradingToken.address, //token2
          bUSDAmount, //amount0
          0, //amount1
          mainnet.apeswap.factory.address, //apefactory
          mainnet.pancakeswap.router.address, //pancakerouter
          apePaybackWBNB
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

        const shiftedPancakeBUSDValue = await new BigNumber(rawPancakeBUSDValue[1]).shiftedBy(-stableToken.decimals);
        const pancakeBUSDValueBN = await new BigNumber(rawPancakeBUSDValue[1]);



        // get WBNB/BUSD on Apeswap
        const rawApeBUSDValue = await apeswap.router.methods
          .getAmountsOut(shiftedWBNBBorrowAmount,
            [tradingToken.address,
              stableToken.address])
          .call();
        const shiftedApeBUSDValue = await new BigNumber(rawApeBUSDValue[1]).shiftedBy(-stableToken.decimals);
        const apeBUSDValueBN = await new BigNumber(rawApeBUSDValue[1]);




        // Set x Borrow Amount BNB / y BUSD Borrow Amount
        const bUSDBorrowAmount = (Number(shiftedApeBUSDValue.toString()));
        const shiftedBUSDBorrowAmount = new BigNumber(bUSDBorrowAmount).shiftedBy(stableToken.decimals);




        // get WBNB
        const rawPancakeWBNBValue = await pancakeswap.router.methods
          .getAmountsOut(shiftedBUSDBorrowAmount,
            [stableToken.address,
              tradingToken.address])
          .call();
        const shiftedPancakeWBNBValue = await new BigNumber(rawPancakeWBNBValue[1])
          .shiftedBy(-tradingToken.decimals);
        const pancakeWBNBValueBN = await new BigNumber(rawPancakeWBNBValue[1]);



        // get BUSD/WBNB on Apeswap
        const rawApeWBNBValue = await apeswap.router.methods
          .getAmountsOut(shiftedBUSDBorrowAmount,
            [stableToken.address,
              tradingToken.address])
          .call();
        const shiftedApeWBNBValue = await new BigNumber(rawApeWBNBValue[1])
          .shiftedBy(-tradingToken.decimals);
        const apeWBNBValueBN = await new BigNumber(rawApeWBNBValue[1]);


        let bUSDAmount = shiftedBUSDBorrowAmount;
        let wBNBAmount = pancakeWBNBValueBN;

        // let slippage = Number(0.02) * wBNBAmount;
        // let wBNBAmountMinusSlippage = wBNBAmount - slippage;
        // console.log(
        //   {
        //     wBNBAmount:wBNBAmount.toString(),
        //     slippage:slippage,
        //     percentage: '0.1',
        //     wBNBAmountMinusSlippage:wBNBAmountMinusSlippage.toString()
        //   }
        // )

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

        const pancakeWBNBResults = {
          buy: new BigNumber(((bUSDAmount / pancakeBUSDValueBN) * wBNBAmount))
            .shiftedBy(-tradingToken.decimals)
            .toString(),
          sell: new BigNumber(((pancakeWBNBValueBN / wBNBAmount) * wBNBAmount))
            .shiftedBy(-tradingToken.decimals)
            .toString()
        }

        const pancakeBUSDResults = {
          buy: new BigNumber(((wBNBAmount / pancakeWBNBValueBN) * bUSDAmount))
            .shiftedBy(-stableToken.decimals)
            .toString(),
          sell: new BigNumber(((pancakeBUSDValueBN / bUSDAmount) * bUSDAmount))
            .shiftedBy(-stableToken.decimals)
            .toString()
        }

        console.log(pancakeWBNBResults, pancakeBUSDResults)


        const apePaybackCalcBUSD = (apeWBNBResults.buy * 1000) / 996;
        const apePaybackBUSD = new BigNumber(apePaybackCalcBUSD).shiftedBy(stableToken.decimals);
        const apePaybackBUSDFee = apePaybackCalcBUSD - apeWBNBResults.buy;

        const apePaybackCalcWBNB = (apeBUSDResults.buy * 1000) / 996;
        const apePaybackWBNB = new BigNumber(apePaybackCalcWBNB).shiftedBy(tradingToken.decimals);
        const apePaybackWBNBFee = apePaybackCalcWBNB - apeBUSDResults.buy;

        const pancakePaybackCalcBUSD = (pancakeWBNBResults.buy * 1000) / 996;
        const pancakePaybackBUSD = new BigNumber(pancakePaybackCalcBUSD).shiftedBy(stableToken.decimals);
        const pancakePaybackBUSDFee = pancakePaybackCalcBUSD - pancakeWBNBResults.buy;

        const pancakePaybackCalcWBNB = (pancakeBUSDResults.buy * 1000) / 996;
        const pancakePaybackWBNB = new BigNumber(pancakePaybackCalcWBNB).shiftedBy(tradingToken.decimals);
        const pancakePaybackWBNBFee = pancakePaybackCalcWBNB - pancakeBUSDResults.buy;


        const gasPrice = await web3.eth.getGasPrice();
        const txCost = 330000 * parseInt(gasPrice);


        const currentBNBPrice = (Number(pancakeWBNBResults.buy) + Number(pancakeWBNBResults.sell)) / 2;

        const apeToPancakeWBNBProfit = new BigNumber(wBNBAmount * (Number(apeWBNBResults.sell) - Number(pancakeWBNBResults.buy))
          - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackWBNBFee)))
          .shiftedBy(-tradingToken.decimals).toString();

        const apeToPancakeBUSDProfit = new BigNumber(bUSDAmount * (Number(apeBUSDResults.sell) - Number(pancakeBUSDResults.buy))
          - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(apePaybackBUSDFee)))
          .shiftedBy(-stableToken.decimals).toString();

        const pancakeToApeWBNBProfit = new BigNumber(wBNBAmount * (Number(pancakeWBNBResults.sell) - Number(apeWBNBResults.buy))
          - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackWBNBFee)))
          .shiftedBy(-stableToken.decimals).toString();

        const pancakeToApeBUSDProfit = new BigNumber(bUSDAmount * (Number(pancakeBUSDResults.sell) - Number(apeBUSDResults.buy))
          - (new BigNumber(txCost).shiftedBy(-tradingToken.decimals) * Number(currentBNBPrice) + Number(pancakePaybackBUSDFee)))
          .shiftedBy(-tradingToken.decimals).toString();

        //console.log(pancakeToApeBUSDProfit)

        if (apeToPancakeWBNBProfit > 0 && apeToPancakeWBNBProfit > pancakeToApeWBNBProfit) {
          console.log("Arbitrage opportunity found!");
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan WBNB on Apeswap at ${apeWBNBResults.buy} `);
          console.log(`Sell WBNB on Pancakeswap at ${pancakeWBNBResults.sell} `);
          console.log(`Expected profit: ${apeToPancakeWBNBProfit} WBNB`);

          let slippage = Number(0.02) * wBNBAmount;
          let wBNBAmountMinusSlippage = wBNBAmount - slippage;


          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmountMinusSlippage, //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
            pancakePaybackBUSD
          );

          let requestData = tx.encodeABI();
          const txData = {
            from: admin.address,
            to: flashloan.options.address,
            requestData,
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
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Buy WBNB from Pancakeswap at ${pancakeWBNBResults.buy} `);
          console.log(`Sell WBNB from ApeSwap at ${apeWBNBResults.sell}`);
          console.log(`Expected profit: ${pancakeToApeWBNBProfit} WBNB`);

          let slippage = Number(0.02) * wBNBAmount;
          let wBNBAmountMinusSlippage = wBNBAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            tradingToken.address, //token1
            stableToken.address, //token2
            wBNBAmountMinusSlippage, //amount0
            0, //amount1
            mainnet.pancakeswap.factory.address, //pancakefactory
            mainnet.apeswap.router.address, // aperouter
            apePaybackBUSD.toString()
          );

          let requestData = tx.encodeABI();
          const txData = {
            from: admin.address,
            to: flashloan.options.address,
            requestData,
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
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan BUSD on Apeswap at ${apeBUSDResults.buy} `);
          console.log(`Sell BUSD on PancakeSwap at ${pancakeBUSDResults.sell} `);
          console.log(`Expected profit: ${apeToPancakeBUSDProfit} BUSD`);

          let slippage = Number(0.02) * bUSDAmount;
          let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmountMinusSlippage, //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
            pancakePaybackWBNB.toString()
          );

          let requestData = tx.encodeABI();
          const txData = {
            from: admin.address,
            to: flashloan.options.address,
            requestData,
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
          console.log(pad(colors.yellow('Current Time:'), 30),
            moment().format('ll') + ' ' + moment().format('LTS'));
          console.log(`Flashloan BUSD on Pancakeswap at ${pancakeBUSDResults.buy} `);
          console.log(`Sell BUSD on Apeswap at ${apeBUSDResults.sell} `);
          console.log(`Expected profit: ${pancakeToApeBUSDProfit} BUSD`);

          let slippage = Number(0.02) * bUSDAmount;
          let bUSDAmountMinusSlippage = bUSDAmount - slippage;

          let tx = flashloan.methods.startArbitrage(
            stableToken.address, //token1
            tradingToken.address, //token2
            bUSDAmountMinusSlippage, //amount0
            0, //amount1
            mainnet.apeswap.factory.address, //apefactory
            mainnet.pancakeswap.router.address, //pancakerouter
            apePaybackWBNB
          );

          let requestData = tx.encodeABI();
          const txData = {
            from: admin.address,
            to: flashloan.options.address,
            requestData,
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