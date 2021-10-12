const {mainnet} = require("../../../addresses");

let uniswapRouter, uniswapFactory;

function determineNetworkProps(network) {

  switch (network) {
    case 'MAINNET':
      uniswapRouter = {
        'address': mainnet.uniswap.router.address,
        'ABI': mainnet.uniswap.router.ABI,
        'contract': new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address)
      }
      uniswapFactory = {
        'address': mainnet.uniswap.factory.address,
        'ABI': mainnet.uniswap.factory.ABI,
        'contract': new web3.eth.Contract(mainnet.uniswap.factory.ABI, mainnet.uniswap.factory.address)
        }
        break;
    case 'KOVAN':
      uniswapRouter = {
        'address': kovan.uniswap.router.address,
        'ABI': kovan.uniswap.router.ABI,
        'contract': new web3.eth.Contract(kovan.uniswap.router.ABI, kovan.uniswap.router.address)
      }
      uniswapFactory = {
        'address': kovan.uniswap.factory.address,
        'ABI': kovan.uniswap.factory.ABI,
        'contract': new web3.eth.Contract(kovan.uniswap.factory.ABI, kovan.uniswap.factory.address)
      }
      break;
    case 'ROPSTEN':
      uniswapRouter = {
        'address': ropsten.uniswap.router.address,
        'ABI': ropsten.uniswap.router.ABI,
        'contract': new web3.eth.Contract(ropsten.uniswap.router.ABI, ropsten.uniswap.router.address)
      }
      uniswapFactory = {
        'address': ropsten.uniswap.factory.address,
        'ABI': ropsten.uniswap.factory.ABI,
        'contract': new web3.eth.Contract(ropsten.uniswap.factory.ABI, ropsten.uniswap.factory.address)
      }
      break;
    default:
  }
}
module.exports = {
  priceCheck: function (web3Provider, token1Address, token2Address) {
    let token1, token2, tokenPair;

// setup router

// const uniswapRouter = {
//   'address':
// }
    const uniswapUsdcAddress = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
    let uniswapAbi;

    const getUniswapContract = async address => await new ethers.Contract(address, uniswapAbi, provider);

    const getEthUsdPrice = async () => await getUniswapContract(uniswapUsdcAddress)
      .then(contract => contract.getReserves())
      .then(reserves => Number(reserves._reserve0) / Number(reserves._reserve1) * 1e12); // times 10^12 because usdc only has 6 decimals



    return {
      pair: `${token1.name}`+'/'+`${token2.name}`,
      pairAddress: pair.address,
      token1Price: token1.price,
      token2Price: token2.price,
    }
  },
}