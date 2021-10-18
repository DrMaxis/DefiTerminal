require("dotenv").config();
const Web3 = require('web3');
const _ = require('lodash');
const {mainnet, ropsten, kovan} = require('../../../../utils/addresses');
const {Token, ChainId, Pair, TokenAmount} = require("@uniswap/sdk");
const Flashloan = require("../../../../.././build/contracts/SushiUniFlashloan.json");


process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    fetchData(data);
  }
})


async function fetchData(data) {
  let network, stableToken, tradingToken, ethPrice, web3, flashloan, networkId, soloAddress, admin, uniswap, sushiswap, uniswapEthPrice, sushiswapEthPrice;
  console.log(`Initiating Arbitrage of ${data.pair} between ${data.buyingExchange} & ${data.sellingExchange}`);

  switch (data.network) {
    case 'Mainnet':
      //network = ChainId.MAINNET
      stableToken = mainnet.tokenPairs[data.pair].stableToken;
      tradingToken = mainnet.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MAINNET_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
      soloAddress = mainnet.dydx.solo.address;
      uniswap = new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address);
      sushiswap = new web3.eth.Contract(mainnet.sushiswap.router.ABI, mainnet.sushiswap.router.address);
      break;
    case 'Ropsten':
      network = ChainId.ROPSTEN
      stableToken = ropsten.tokenPairs[data.pair].stableToken;
      tradingToken = ropsten.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ROPSTEN_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
      //TODO: GET ROPSTEN DYDX SOLO ADDRESS
      uniswap = new web3.eth.Contract(ropsten.uniswap.router.ABI, ropsten.uniswap.router.address);
      sushiswap = new web3.eth.Contract(ropsten.sushiswap.router.ABI, ropsten.sushiswap.router.address);
      break;
    case 'Kovan':
      network = ChainId.KOVAN
      stableToken = kovan.tokenPairs[data.pair].stableToken;
      tradingToken = kovan.tokenPairs[data.pair].tradingToken;
      web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.KOVAN_INFURA_WSS_URL));
      admin = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      networkId = await web3.eth.net.getId();
      flashloan = new web3.eth.Contract(Flashloan.abi, Flashloan.networks[networkId].address);
      soloAddress = kovan.dydx.solo.address;
      uniswap = new web3.eth.Contract(kovan.uniswap.router.ABI, kovan.uniswap.router.address);
      sushiswap = new web3.eth.Contract(kovan.sushiswap.router.ABI, kovan.sushiswap.router.address);
      break;
  }

  const BORROW_AMOUNT = data.borrowAmount;
  const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));
  const DIRECTION = {SUSHI_TO_UNISWAP: 0, UNISWAP_TO_SUSHI: 1};


  console.log('Fetching Uniswap ETH price...');
  const uniswapPrice = await uniswap.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
  uniswapEthPrice = web3.utils.toBN('1').mul(web3.utils.toBN(uniswapPrice[1])).div(ONE_WEI);
  const RECENT_UNISWAP_PRICE =  uniswapEthPrice;
  console.log(`Recent ETH Price on Uniswap: ${RECENT_UNISWAP_PRICE}`)

  console.log('Fetching Sushiswap ETH price...');
  const sushiswapPrice = await sushiswap.methods.getAmountsOut(web3.utils.toWei('1'), [tradingToken.address, stableToken.address]).call();
  sushiswapEthPrice = web3.utils.toBN('1').mul(web3.utils.toBN(sushiswapPrice[1])).div(ONE_WEI);
  const RECENT_SUSHISWAP_PRICE =  sushiswapEthPrice;
  console.log(`Recent ETH Price on SushiSwap: ${RECENT_SUSHISWAP_PRICE}`)

  const RECENT_ETH_PRICE = RECENT_UNISWAP_PRICE.add(RECENT_SUSHISWAP_PRICE).divn(2);
  console.log(`The average ETH price between ${data.buyingExchange} and ${data.sellingExchange}: ${RECENT_ETH_PRICE}`)

  const AMOUNT_TRADINGTOKEN_WEI = web3.utils.toWei(BORROW_AMOUNT);
  const AMOUNT_STABLETOKEN_WEI = web3.utils.toWei(RECENT_ETH_PRICE.mul(web3.utils.toBN(BORROW_AMOUNT)));

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);

      /**
       *
       * @method getAmountsOut
       *
       * Given an input asset amount and an array of token addresses, calculates all subsequent maximum output
       * token amounts by calling getReserves for each pair of token addresses in the path in turn, and using these to call getAmountOut.
       * Useful for calculating optimal token amounts before calling swap.
       *
       *
       * @mixed amountsOut1 = get max amount of weth based on the amount of stable token going into sushiswap
       * @mixed amountsOut2 = get uniswap max amount of weth based on the amount of weth sushiswap returns
       *
       * @mixed amountsOut3 = get max amount of weth based on the amount of stable token going into uniswap
       * @mixed amountsOut4 = get sushiswap max amount of weth based on the amount of weth uniswap returns
       *
       */

      const amountsOut1 = await sushiswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
      const amountsOut2 = await uniswap.methods.getAmountsOut(amountsOut1[1], [tradingToken.address, stableToken.address]).call();
      console.log('amounts out1' , amountsOut1, 'amounts out 2', amountsOut2);
      const amountsOut3 = await uniswap.methods.getAmountsOut(AMOUNT_STABLETOKEN_WEI, [stableToken.address, tradingToken.address]).call();
      const amountsOut4 = await sushiswap.methods.getAmountsOut(amountsOut3[1], [tradingToken.address, stableToken.address]).call();

      console.log(`Sushi -> Uniswap.  ${stableToken.name}  / ${tradingToken.name}: ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountsOut2[1].toString())}`);
      console.log(`Uniswap -> Sushi.  ${stableToken.name}  / ${tradingToken.name}: ${web3.utils.fromWei(AMOUNT_STABLETOKEN_WEI.toString())} / ${web3.utils.fromWei(amountsOut4[1].toString())}`);

      const daiFromUniswap = web3.utils.toBN(amountsOut2[1])
      const daiFromSushi = web3.utils.toBN(amountsOut4[1])

      console.log({
        stableTokenFromUni: daiFromUniswap.toString(),
        stableTokenFromSushi: daiFromSushi.toString(),
        borrowAmountInWei: AMOUNT_STABLETOKEN_WEI,
      })


        const tx = flashloan.methods.initiateFlashloan(
          soloAddress,
          stableToken.address,
          AMOUNT_STABLETOKEN_WEI,
          DIRECTION.SUSHI_TO_UNISWAP
        );


        const [gasPrice, gasCost] = await Promise.all([
          web3.eth.getGasPrice(),
          tx.estimateGas({from: admin}),
        ]);


         const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(ethPrice);
         const profit = daiFromUniswap.sub(AMOUNT_STABLETOKEN_WEI).sub(txCost);
      console.log(txCost, profit);
        //console.log('gas price', gasPrice, 'cost', gasCost);
        // if(profit > 0) {
        //   console.log('Arb opportunity found Sushi -> Uniswap!');
        //   console.log(`Expected profit: ${web3.utils.fromWei(profit)} Dai`);
        //   const data = tx.encodeABI();
        //   const txData = {
        //     from: admin,
        //     to: flashloan.options.address,
        //     data,
        //     gas: gasCost,
        //     gasPrice
        //   };
        //   const receipt = await web3.eth.sendTransaction(txData);
        //   console.log(`Transaction hash: ${receipt.transactionHash}`);
        // }


      // if(daiFromSushi.gt(AMOUNT_STABLETOKEN_WEI)) {
      //   const tx = flashloan.methods.initiateFlashloan(
      //     soloAddress,
      //     stableToken.address,
      //     AMOUNT_STABLETOKEN_WEI,
      //     DIRECTION.UNISWAP_TO_SUSHI
      //   );
      //   const [gasPrice, gasCost] = await Promise.all([
      //     web3.eth.getGasPrice(),
      //     tx.estimateGas({from: admin}),
      //   ]);
      //   const txCost = web3.utils.toBN(gasCost).mul(web3.utils.toBN(gasPrice)).mul(ethPrice);
      //   const profit = daiFromSushi.sub(AMOUNT_STABLETOKEN_WEI).sub(txCost);
      //
      //   if(profit > 0) {
      //     console.log('Arb opportunity found Uniswap -> Sushi!');
      //     console.log(`Expected profit: ${web3.utils.fromWei(profit)} Dai`);
      //     const data = tx.encodeABI();
      //     const txData = {
      //       from: admin,
      //       to: flashloan.options.address,
      //       data,
      //       gas: gasCost,
      //       gasPrice
      //     };
      //     const receipt = await web3.eth.sendTransaction(txData);
      //     console.log(`Transaction hash: ${receipt.transactionHash}`);
      //   }
      // }

    })
    .on('error', error => {
      console.log(error);
    });

}