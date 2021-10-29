require('dotenv').config();
const {mainnet} = require('../../../program/utils/addresses');
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
       mainnet.kyber.proxy.address, // kyber proxy
       mainnet.sushiswap.router.address, // sushi router
       mainnet.tokens.Ethereum.weth.address, // WETH
       mainnet.tokens.Ethereum.dai, // dai
       deployer.address //process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("KySushiArbitrage Contract deployed to:", contract.address);
}

async function deployKyUniContract(){

  let [deployer] = await hre.ethers.getSigners();
  let KyUniArbitrage = await hre.ethers.getContractFactory("KyUniArbitrage");
  let contract = KyUniArbitrage.deploy(
      mainnet.kyber.proxy.address, // kyber proxy
      mainnet.uniswap.router.address, // uniswap router
      mainnet.tokens.Ethereum.weth.address, // WETH
      mainnet.tokens.Ethereum.dai, // dai
      deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("KyUniArbitrage Contract deployed to:", contract.address);

}

async function deploySushiKyContract(){

  let [deployer] = await hre.ethers.getSigners();
  let SushiKyArbitrage = await hre.ethers.getContractFactory("SushiKyArbitrage");
  let contract = SushiKyArbitrage.deploy(
      mainnet.sushiswap.router.address, // sushi router
      mainnet.kyber.proxy.address, // kyber proxy
      mainnet.tokens.Ethereum.weth.address, // WETH
      mainnet.tokens.Ethereum.dai, // dai
      deployer.address //process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("SushiKyArbitrage Contract deployed to:", contract.address);
}

async function deploySushiUniContract(){

  let [deployer] = await hre.ethers.getSigners();

  let SushiUniArbitrage = await hre.ethers.getContractFactory("SushiUniArbitrage");
  let contract = SushiUniArbitrage.deploy(
      mainnet.sushiswap.router.address, // sushi router
      mainnet.uniswap.router.address, // uniswap router
      mainnet.tokens.Ethereum.weth.address, // WETH
      mainnet.tokens.Ethereum.dai, // dai
      deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("SushiUniArbitrage Contract deployed to:", contract.address);
}


async function deployUniKyContract(){

  let [deployer] = await hre.ethers.getSigners();

  let UniKyArbitrage = await hre.ethers.getContractFactory("UniKyArbitrage");
  let contract = UniKyArbitrage.deploy(
      mainnet.uniswap.router.address, // uniswap router
      mainnet.kyber.proxy.address, // kyber proxy
      mainnet.tokens.Ethereum.weth.address, // WETH
      mainnet.tokens.Ethereum.dai, // dai
      deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("UniKyArbitrage Contract deployed to:", contract.address);

}


async function deployUniSushiContract(){

  let [deployer] = await hre.ethers.getSigners();

  let UniSushiArbitrage = await hre.ethers.getContractFactory("UniSushiArbitrage");
  let contract = UniSushiArbitrage.deploy(
      mainnet.uniswap.router.address, // uniswap router
      mainnet.sushiswap.router.address, // sushi router
      mainnet.tokens.Ethereum.weth.address, // WETH
      mainnet.tokens.Ethereum.dai, // dai
      deployer.address // process.env.ACCOUNT,
  );

  await contract.deployed();
  console.log("UniSushiArbitrage Contract deployed to:", contract.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

