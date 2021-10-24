const sushiUni = artifacts.require("SushiUniFlashloan");
const { kovan } = require('../program/utils/addresses/kovan');

module.exports = function(deployer, _network, [beneficiaryAddress, _]) {
  deployer.deploy(
    sushiUni,
    kovan.sushiswap.router.address,
    kovan.uniswap.router.address,
    kovan.tokens.weth.address,
    kovan.tokens.dai_v1.address,
    beneficiaryAddress
  );
};
