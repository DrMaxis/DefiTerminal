require('dotenv').config();
const {mainnet} = require('../../../program/utils/addresses');
const hre = require("hardhat");


async function main() {
  await hre.run('compile');
  await deployContracts();

}

async function deployContracts() {
  await deployApeBakeryContract();
  await deployApePancakeContract();
  await deployBakeryApeContract();
  await deployBakeryPancakeContract();
  await deployPancakeApeContract();
  await deployPancakeBakeryContract();
}

async function deployApeBakeryContract(){

  let [deployer] = await hre.ethers.getSigners();
  let ApeBakeryArbitrage = await hre.ethers.getContractFactory("ApeBakeryArbitrage");
  let contract = ApeBakeryArbitrage.deploy(
    mainnet.apeswap.factory.address, //apefactory
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.apeswap.router.address, //aperouter
    mainnet.bakeryswap.router.address, //bakeryrouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("ApeBakeryArbitrage Contract deployed to:", contract.address);
}

async function deployApePancakeContract(){

  let [deployer] = await hre.ethers.getSigners();
  let ApePancakeArbitrage = await hre.ethers.getContractFactory("ApePancakeArbitrage");
  let contract = ApePancakeArbitrage.deploy(
    mainnet.apeswap.factory.address, //apefactory
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.apeswap.router.address, //aperouter
    mainnet.pancakeswap.router.address, //pancakerouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("ApePancakeArbitrage Contract deployed to:", contract.address);

}

async function deployBakeryApeContract(){

  let [deployer] = await hre.ethers.getSigners();
  let BakeryApeArbitrage = await hre.ethers.getContractFactory("BakeryApeArbitrage");
  let contract = BakeryApeArbitrage.deploy(
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.apeswap.factory.address, //apefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.bakeryswap.router.address, //bakeryrouter
    mainnet.apeswap.router.address, //aperouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("BakeryApeArbitrage Contract deployed to:", contract.address);
}

async function deployBakeryPancakeContract(){

  let [deployer] = await hre.ethers.getSigners();

  let BakeryPancakeArbitrage = await hre.ethers.getContractFactory("BakeryPancakeArbitrage");
  let contract = BakeryPancakeArbitrage.deploy(
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.bakeryswap.router.address, //bakeryrouter
    mainnet.pancakeswap.router.address, //pancakerouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("BakeryPancakeArbitrage Contract deployed to:", contract.address);
}


async function deployPancakeApeContract(){

  let [deployer] = await hre.ethers.getSigners();

  let PancakeApeArbitrage = await hre.ethers.getContractFactory("PancakeApeArbitrage");
  let contract = PancakeApeArbitrage.deploy(
    mainnet.pancakeswap.factory.address, //pancakefactory
    mainnet.apeswap.factory.address, //apefactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.pancakeswap.router.address, //pancakerouter
    mainnet.apeswap.router.address, //aperouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("PancakeApeArbitrage Contract deployed to:", contract.address);

}


async function deployPancakeBakeryContract(){

  let [deployer] = await hre.ethers.getSigners();

  let PancakeBakeryArbitrage = await hre.ethers.getContractFactory("PancakeBakeryArbitrage");
  let contract = PancakeBakeryArbitrage.deploy(
    mainnet.pancakeswap.factory.address, //apefactory
    mainnet.bakeryswap.factory.address, //bakeryfactory
    mainnet.tokens.Binance.wbnb.address, //WBNB Token
    mainnet.pancakeswap.router.address, //pancakerouter
    mainnet.bakeryswap.router.address, //bakeryrouter
    deployer.address   // process.env.ACCOUNT
  );

  await contract.deployed();
  console.log("PancakeBakeryArbitrage Contract deployed to:", contract.address);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

