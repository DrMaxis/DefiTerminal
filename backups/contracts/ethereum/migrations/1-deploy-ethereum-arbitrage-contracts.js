require('dotenv').config();

const {mainnet} = require('../../../../program/utils/addresses')
const KySushiArbitrage = require('../build/contracts/KySushiArbitrage.json');
const KyUniArbitrage = require('../build/contracts/KyUniArbitrage.json');
const SushiKyArbitrage = require('../build/contracts/SushiKyArbitrage.json');
const SushiUniArbitrage = require('../build/contracts/SushiUniArbitrage.json');
const UniKyArbitrage = require('../build/contracts/UniKyArbitrage.json');
const UniSushiArbitrage = require('../build/contracts/UniSushiArbitrage.json');


module.exports = function (deployer) {


  // Deploying them all at once wouldnt be ideal.
  // Uncomment out the specfic contract you want to deploy
  // and run the migration one at a time.


  deployer.deploy(
    KySushiArbitrage,
    mainnet.kyber.proxy.address, // kyber proxy
    mainnet.sushiswap.router.address, // sushi router
    mainnet.tokens.Ethereum.weth.address, // WETH
    mainnet.tokens.Ethereum.dai, // dai
    process.env.ACCOUNT,
  );


  // deployer.deploy(
  //   KyUniArbitrage,
  //   mainnet.kyber.proxy.address, // kyber proxy
  //   mainnet.uniswap.router.address, // uniswap router
  //   mainnet.tokens.Ethereum.weth.address, // WETH
  //   mainnet.tokens.Ethereum.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   SushiKyArbitrage,
  //   mainnet.sushiswap.router.address, // sushi router
  //   mainnet.kyber.proxy.address, // kyber proxy
  //   mainnet.tokens.Ethereum.weth.address, // WETH
  //   mainnet.tokens.Ethereum.dai, // dai
  //   process.env.ACCOUNT,
  // );

  // deployer.deploy(
  //   SushiUniArbitrage,
  //   mainnet.sushiswap.router.address, // sushi router
  //   mainnet.uniswap.router.address, // uniswap router
  //   mainnet.tokens.Ethereum.weth.address, // WETH
  //   mainnet.tokens.Ethereum.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniKyArbitrage,
  //   mainnet.uniswap.router.address, // uniswap router
  //   mainnet.kyber.proxy.address, // kyber proxy
  //   mainnet.tokens.Ethereum.weth.address, // WETH
  //   mainnet.tokens.Ethereum.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniSushiArbitrage,
  //   mainnet.uniswap.router.address, // uniswap router
  //   mainnet.sushiswap.router.address, // sushi router
  //   mainnet.tokens.Ethereum.weth.address, // WETH
  //   mainnet.tokens.Ethereum.dai, // dai
  //   process.env.ACCOUNT,
  // );

};
