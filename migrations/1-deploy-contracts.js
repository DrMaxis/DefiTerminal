const Flashloan = artifacts.require("Flashloan.sol");
const { mainnet } = require('../program/utils/addresses/mainnet');

module.exports = function(deployer, _network, [beneficiaryAddress, _]) {
  deployer.deploy(
    Flashloan,
    mainnet.kyber.proxy.address,
    mainnet.uniswap.router.address,
    mainnet.tokens.weth.address,
    mainnet.tokens.dai.address,
    beneficiaryAddress
  );
};
