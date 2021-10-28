require('dotenv').config();
const Arbitrage = artifacts.require("PancakeApeArbitrage");
const {mainnet}= require('../program/utils/addresses/')
module.exports = function (deployer) {
  deployer.deploy(
    Arbitrage,
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.apeswap.factory.address, //apefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.pancakeswap.router.address, //pancakerouter
    mainnet.apeswap.router.address, //aperouter
    process.env.ACCOUNT // Beneficiary  Needs to be filled by you with deployment address
);
};