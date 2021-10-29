require('dotenv').config();

const {ropsten} = require('../../../../program/utils/addresses')
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
  //   ropsten.kyber.proxy.address, // kyber proxy
  //   ropsten.sushiswap.router.address, // sushi router
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   KyUniArbitrage,
  //   ropsten.kyber.proxy.address, // kyber proxy
  //   ropsten.uniswap.router.address, // uniswap router
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   SushiKyArbitrage,
  //   ropsten.sushiswap.router.address, // sushi router
  //   ropsten.kyber.proxy.address, // kyber proxy
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );

  // deployer.deploy(
  //   SushiUniArbitrage,
  //   ropsten.sushiswap.router.address, // sushi router
  //   ropsten.uniswap.router.address, // uniswap router
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniKyArbitrage,
  //   ropsten.uniswap.router.address, // uniswap router
  //   ropsten.kyber.proxy.address, // kyber proxy
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   UniSushiArbitrage,
  //   ropsten.uniswap.router.address, // uniswap router
  //   ropsten.sushiswap.router.address, // sushi router
  //   ropsten.tokens.weth.address, // WETH
  //   ropsten.tokens.dai, // dai
  //   process.env.ACCOUNT,
  // );

};
