require('dotenv').config();

const {mainnet} = require('../program/utils/addresses')
const PancakeApeArbitrage = artifacts.require("PancakeApeArbitrage");
const PancakeBakeryArbitrage = artifacts.require("PancakeBakeryArbitrage");
const ApeBakeryArbitrage = artifacts.require("ApeBakeryArbitrage");

module.exports = function (deployer) {

    deployer.deploy(
    ApeBakeryArbitrage,
    mainnet.apeswap.factory.address, //apefactory
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.apeswap.router.address, //aperouter
    mainnet.bakeryswap.router.address, //bakeryrouter
    process.env.ACCOUNT,
);

  deployer.deploy(
    PancakeApeArbitrage,
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.apeswap.factory.address, //apefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.pancakeswap.router.address, //pancakerouter
    mainnet.apeswap.router.address, //aperouter
    process.env.ACCOUNT,
  );


  deployer.deploy(
    PancakeBakeryArbitrage,
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.pancakeswap.router.address, //pancakerouter
    mainnet.bakeryswap.router.address, //bakeryrouter
    process.env.ACCOUNT,
  );

};
