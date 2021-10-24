
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const {kovan} = require("../program/utils/addresses/kovan");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();

  const Flashloan = await hre.ethers.getContractFactory("SushiUniFlashloan");
  const flashloan = await Flashloan.deploy(
    kovan.sushiswap.router.address,
    kovan.uniswap.router.address,
    kovan.tokens.weth.address,
    kovan.tokens.dai.address,
    deployer.address);

  await flashloan.deployed();

  console.log("Greeter deployed to:", flashloan.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});