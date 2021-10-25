const ApeswapService = require("./binance/prices/apeswap");
const BakeryswapService = require("./binance/prices/bakeryswap");
const KyberswapService = require("./ethereum/prices/kyber");
const SushiswapService = require("./ethereum/prices/sushiswap");
const PancakeswapService = require("./binance/prices/pancakeswap");
const UniswapService = require("./ethereum/prices/uniswap");


function startPriceMonitor(data) {

  switch (data.exchange) {
    case 'Apeswap':
      monitorApeswapPairPrices(data);
      break;
    case 'Bakeryswap':
      monitorBakeryswapPairPrices(data);
      break;
    case 'Kyber':
      monitorKyberswapPairPrices(data);
      break;
    case 'Pancakeswap':
      monitorPancakeswapPairPrices(data);
      break;
    case 'Sushiswap':
      monitorSushiswapPairPrices(data);
      break;
    case 'Uniswap':
      monitorUniswapPairPrices(data);
      break;
    default:
  }

}

function monitorApeswapPairPrices(data) {
  return ApeswapService.monitorPrices(data);
}

function monitorBakeryswapPairPrices(data) {
  return BakeryswapService.monitorPrices(data);
}

function monitorKyberswapPairPrices(data) {
  return KyberswapService.monitorPrices(data);
}

function monitorSushiswapPairPrices(data) {
  return SushiswapService.monitorPrices(data);
}

function monitorPancakeswapPairPrices(data) {
  return PancakeswapService.monitorPrices(data);
}

function monitorUniswapPairPrices(data) {
  return UniswapService.monitorPrices(data);
}


module.exports = {
  binance: {
    arbitrage: {},
    prices: {
      initPriceMonitor: function (data) {
        return startPriceMonitor(data);
      },
    }
  },
  ethereum: {
    arbitrage: {},
    prices: {
      initPriceMonitor: function (data) {
        return startPriceMonitor(data);
      },
    },
  },


}