const ApeTokenSwapService = require("./binance/apeswap");
const BakeryTokenSwapService = require("./binance/bakeryswap");
const PancakeTokenSwapService = require('./binance/pancakeswap');
const KyberTokenSwapService = require('./ethereum/kyber');
const SushiTokenSwapService = require('./ethereum/sushiswap');
const UniTokenSwapService = require('./ethereum/uniswap');

function swapTokensOnApeswap(data) {
  return ApeTokenSwapService.swapTokens(data);
}

function swapTokensOnBakeryswap(data) {
  return BakeryTokenSwapService.swapTokens(data);
}

function swapTokensOnPancakeswap(data) {
  return PancakeTokenSwapService.swapTokens(data);
}

function swapTokensOnKyber(data) {
  return KyberTokenSwapService.swapTokens(data);
}

function swapTokensOnSushiswap(data) {
  return SushiTokenSwapService.swapTokens(data);
}

function swapTokensOnUniswap(data) {
  return UniTokenSwapService.swapTokens(data);
}

module.exports = {
  swapper: {
    binance: {
      swapOnApeswap: function(data) {
        return swapTokensOnApeswap(data);
      },
      swapOnBakeryswap: function(data) {
        return swapTokensOnBakeryswap(data);
      },
      swapOnPancakeswap: function(data) {
        return swapTokensOnPancakeswap(data)
      }
    },
    ethereum: {
      swapOnKyber: function(data) {
        return swapTokensOnKyber(data);
      },
      swapOnSushiswap: function(data) {
        return swapTokensOnSushiswap(data);
      },
      swapOnUniswap: function(data) {
        return swapTokensOnUniswap(data)
      }
    }
  }

}