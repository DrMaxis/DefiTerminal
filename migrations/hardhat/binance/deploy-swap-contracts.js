require('dotenv').config();
const hre = require("hardhat");

async function main() {
  await hre.run('compile');
  await deployContracts();
}

async function deployContracts() {

  await deployApeTokenSwapContract();
  await deployBakeryTokenSwapContract();
  await deployPancakeTokenSwapContract();
}

async function deployApeTokenSwapContract(){
  let ApeTokenSwap = await hre.ethers.getContractFactory("ApeTokenSwap");
  let contract = ApeTokenSwap.deploy();
  await contract.deployed();
  console.log("ApeTokenSwap Contract deployed to:", contract.address);
}


async function deployBakeryTokenSwapContract(){
  let BakeryTokenSwap = await hre.ethers.getContractFactory("BakeryTokenSwap");
  let contract = BakeryTokenSwap.deploy();
  await contract.deployed();
  console.log("BakeryTokenSwap Contract deployed to:", contract.address);
}

async function deployPancakeTokenSwapContract(){
  let PancakeTokenSwap = await hre.ethers.getContractFactory("PancakeTokenSwap");
  let contract = PancakeTokenSwap.deploy();
  await contract.deployed();
  console.log("BakeryTokenSwap Contract deployed to:", contract.address);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


