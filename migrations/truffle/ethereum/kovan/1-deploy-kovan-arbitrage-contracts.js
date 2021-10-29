require('dotenv').config();

const {kovan} = require('../../../../program/utils/addresses')
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


  // deployer.deploy(
  //   KySushiArbitrage,
  //   kovan.kyber.proxy.address, // kyber proxy
  //   kovan.sushiswap.router.address, // sushi router
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   KyUniArbitrage,
  //   kovan.kyber.proxy.address, // kyber proxy
  //   kovan.uniswap.router.address, // uniswap router
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   SushiKyArbitrage,
  //   kovan.sushiswap.router.address, // sushi router
  //   kovan.kyber.proxy.address, // kyber proxy
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );

  // deployer.deploy(
  //   SushiUniArbitrage,
  //   kovan.sushiswap.router.address, // sushi router
  //   kovan.uniswap.router.address, // uniswap router
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniKyArbitrage,
  //   kovan.uniswap.router.address, // uniswap router
  //   kovan.kyber.proxy.address, // kyber proxy
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniSushiArbitrage,
  //   kovan.uniswap.router.address, // uniswap router
  //   kovan.sushiswap.router.address, // sushi router
  //   kovan.tokens.weth.address, // WETH
  //   kovan.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );

};
