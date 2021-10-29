require('dotenv').config();
const {ropsten} = require('../../../../program/utils/addresses');
const hre = require("hardhat");


async function main() {
  await hre.run('compile');
  await deployContracts();

}

async function deployContracts() {
  await deployKySushiContract();
  await deployKyUniContract();
  await deploySushiKyContract();
  await deploySushiUniContract();
  await deployUniKyContract();
  await deployUniSushiContract();
}

async function deployKySushiContract(){

  let [deployer] = await hre.ethers.getSigners();
  let KySushiArbitrage = await hre.ethers.getContractFactory("KySushiArbitrage");
  let contract = KySushiArbitrage.deploy(
    ropsten.kyber.proxy.address, // kyber proxy
    ropsten.sushiswap.router.address, // sushi router
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address //process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("KySushiArbitrage Contract deployed to:", contract.address);
}

async function deployKyUniContract(){

  let [deployer] = await hre.ethers.getSigners();
  let KyUniArbitrage = await hre.ethers.getContractFactory("KyUniArbitrage");
  let contract = KyUniArbitrage.deploy(
    ropsten.kyber.proxy.address, // kyber proxy
    ropsten.uniswap.router.address, // uniswap router
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("KyUniArbitrage Contract deployed to:", contract.address);

}

async function deploySushiKyContract(){

  let [deployer] = await hre.ethers.getSigners();
  let SushiKyArbitrage = await hre.ethers.getContractFactory("SushiKyArbitrage");
  let contract = SushiKyArbitrage.deploy(
    ropsten.sushiswap.router.address, // sushi router
    ropsten.kyber.proxy.address, // kyber proxy
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address //process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("SushiKyArbitrage Contract deployed to:", contract.address);
}

async function deploySushiUniContract(){

  let [deployer] = await hre.ethers.getSigners();

  let SushiUniArbitrage = await hre.ethers.getContractFactory("SushiUniArbitrage");
  let contract = SushiUniArbitrage.deploy(
    ropsten.sushiswap.router.address, // sushi router
    ropsten.uniswap.router.address, // uniswap router
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("SushiUniArbitrage Contract deployed to:", contract.address);
}


async function deployUniKyContract(){

  let [deployer] = await hre.ethers.getSigners();

  let UniKyArbitrage = await hre.ethers.getContractFactory("UniKyArbitrage");
  let contract = UniKyArbitrage.deploy(
    ropsten.uniswap.router.address, // uniswap router
    ropsten.kyber.proxy.address, // kyber proxy
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("UniKyArbitrage Contract deployed to:", contract.address);

}


async function deployUniSushiContract(){

  let [deployer] = await hre.ethers.getSigners();

  let UniSushiArbitrage = await hre.ethers.getContractFactory("UniSushiArbitrage");
  let contract = UniSushiArbitrage.deploy(
    ropsten.uniswap.router.address, // uniswap router
    ropsten.sushiswap.router.address, // sushi router
    ropsten.tokens.weth.address, // WETH
    ropsten.tokens.dai, // dai
    deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("UniSushiArbitrage Contract deployed to:", contract.address);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

