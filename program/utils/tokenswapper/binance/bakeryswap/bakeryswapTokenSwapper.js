require("dotenv").config();
const Web3 = require('web3');
const BigNumber = require("bignumber.js");
const {mainnet} = require('../../../addresses');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");
const BakeryTokenSwapContract = require('../../../../../build/contracts/BakeryTokenSwap.json')
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.MORALIAS_BSC_MAINNET_WSS_URL));



process.on('message', function (data) {
  if (data === false) {
    process.exit(1);
  } else {
    swap(data);
  }

  async function swap(data) {

    let decimals;
    const networkID = await web3.eth.net.getId();
    const SwapContract = new web3.eth.Contract(BakeryTokenSwapContract.abi, BakeryTokenSwapContract.networks[networkID].address);

    if(data.digits === '' || typeof data.digits === 'undefined') {
      decimals = Number(18);
    } else {
      decimals = data.digits;
    }
    const admin  = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

    const bakeryswap = {
      factory: new web3.eth.Contract(mainnet.bakeryswap.factory.ABI, mainnet.bakeryswap.factory.address),
      router: new web3.eth.Contract(mainnet.bakeryswap.router.ABI, mainnet.bakeryswap.router.address),
    }

    let fromToken = {
      address: data.swapToken,
      ABI: new web3.eth.Contract(mainnet.tokens.Binance.BEP20.ABI, data.swapToken),
      decimals: decimals,
    };

    let toToken = {
      address: data.returnToken,
      ABI: new web3.eth.Contract(mainnet.tokens.Binance.BEP20.ABI, data.returnToken),
      decimals: decimals,
    };

    let tokenPair = {
      address: await bakeryswap.factory.methods.getPair(fromToken.address, toToken.address).call()
    };

    if(tokenPair.address === null || typeof tokenPair.address === 'undefined') {
      console.log(
        pad(colors.magenta('A token pair could not be found with the specified addresses.'), 30), fromToken.address,
        pad(colors.magenta('=> '), 30), toToken.address);
      process.exit(1);
    }


    const swapAmount = new BigNumber(data.amount);
    const swapAmountInWei = new BigNumber(swapAmount).shiftedBy(decimals);


    const amountOutOfReturnToken = await bakeryswap.router.methods.getAmountsOut(swapAmountInWei, [fromToken.address, toToken.address]).call();
    let shiftedAmountOutOfReturn = new BigNumber(amountOutOfReturnToken[1]).shiftedBy(-decimals);
    const returnAmountInWei = new BigNumber(amountOutOfReturnToken[1]);


    console.log(pad(colors.yellow('Current I/O Values as of '), 30),
      moment().format('ll') + '' + moment().format('LTS'));

    console.log(
      pad(colors.magenta('Swapping token at address'), 30), fromToken.address,
      pad(colors.magenta('For token at address'), 30), toToken.address);

    console.log(
      pad(colors.green('Amount Going Out'), 30), swapAmount.toString(),
      pad(colors.green('Amount Being Returned'), 30), shiftedAmountOutOfReturn.toString());


    const tx = await BakeryTokenSwapContract.methods.startSwap(
      fromToken.address,
      toToken.address,
      swapAmountInWei,
      0,
    );

    const requestData = tx.encodeABI();
    const txData = {
      from: admin.address,
      to: SwapContract.options.address,
      requestData,
      gas: 310000,
      gasPrice: 5000000000, // 5Gwei
    };
    const receipt = await web3.eth.sendTransaction(txData);
    process.send(receipt)

  }

});