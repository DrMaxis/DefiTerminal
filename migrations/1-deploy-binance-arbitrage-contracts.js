require('dotenv').config();

const {mainnet} = require('../program/utils/addresses')
const ApeBakeryArbitrage = require('../build/contracts/ApeBakeryArbitrage.json');
const ApePancakeArbitrage = require('../build/contracts/ApePancakeArbitrage.json');
const BakeryApeArbitrage = require('../build/contracts/BakeryApeArbitrage.json');
const BakeryPancakeArbitrage = require('../build/contracts/BakeryPancakeArbitrage.json');
const PancakeApeArbitrage = require('../build/contracts/PancakeApeArbitrage.json');
const PancakeBakeryArbitrage = require('../build/contracts/PancakeBakeryArbitrage.json');


module.exports = function (deployer) {

  // Deploying them all at once wouldnt be ideal.
  // Uncomment out the specfic contract you want to deploy
  // and run the migration one at a time.

//   deployer.deploy(
//     ApeBakeryArbitrage,
//     mainnet.apeswap.factory.address, //apefactory
//     mainnet.bakeryswap.factory.address, //bakeryfactory
//     mainnet.tokens.Binance.wbnb.address, //WBNB Token
//     mainnet.apeswap.router.address, //aperouter
//     mainnet.bakeryswap.router.address, //bakeryrouter
//     process.env.ACCOUNT,
// );


  // deployer.deploy(
  //   ApePancakeArbitrage,
  //   mainnet.apeswap.factory.address, //apefactory
  //   mainnet.pancakeswap.factory.address, //pancakefactory
  //   mainnet.tokens.Binance.wbnb.address, //WBNB Token
  //   mainnet.apeswap.router.address, //aperouter
  //   mainnet.pancakeswap.router.address, //pancakerouter
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   BakeryApeArbitrage,
  //   mainnet.bakeryswap.factory.address, //bakeryfactory
  //   mainnet.apeswap.factory.address, //apefactory
  //   mainnet.tokens.Binance.wbnb.address, //WBNB Token
  //   mainnet.bakeryswap.router.address, //bakeryrouter
  //   mainnet.apeswap.router.address, //aperouter
  //   process.env.ACCOUNT,
  // );

  // deployer.deploy(
  //   BakeryPancakeArbitrage,
  //   mainnet.bakeryswap.factory.address, //bakeryfactory
  //   mainnet.pancakeswap.factory.address, //apefactory
  //   mainnet.tokens.Binance.wbnb.address, //WBNB Token
  //   mainnet.bakeryswap.router.address, //bakeryrouter
  //   mainnet.pancakeswap.router.address, //pancakerouter
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   PancakeApeArbitrage,
  //   mainnet.pancakeswap.factory.address, //pancakefactory
  //   mainnet.apeswap.factory.address, //apefactory
  //   mainnet.tokens.Binance.wbnb.address, //WBNB Token
  //   mainnet.pancakeswap.router.address, //pancakerouter
  //   mainnet.apeswap.router.address, //aperouter
  //   process.env.ACCOUNT,
  // );


  // deployer.deploy(
  //   PancakeBakeryArbitrage,
  //   mainnet.pancakeswap.factory.address, //pancakefactory
  //   mainnet.bakeryswap.factory.address, //bakeryfactory
  //   mainnet.tokens.Binance.wbnb.address, //WBNB Token
  //   mainnet.pancakeswap.router.address, //pancakerouter
  //   mainnet.bakeryswap.router.address, //bakeryrouter
  //   process.env.ACCOUNT,
  // );

};
