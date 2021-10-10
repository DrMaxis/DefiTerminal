const Flashloan = artifacts.require("Flashloan.sol");
const { mainnet: addresses } = require('../addresses/mainnet');

module.exports = function(deployer, _network, [beneficiaryAddress, _]) {
  deployer.deploy(
    Flashloan,
    addresses.kyber.proxy,
    addresses.uniswap.router,
    addresses.tokens.weth,
    addresses.tokens.dai,
    beneficiaryAddress
  );
};
