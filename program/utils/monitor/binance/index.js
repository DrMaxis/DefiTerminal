const ApeswapPriceMonitor = require('./prices/apeswap');
const BakeryswapPriceMonitor = require('./prices/bakeryswap');
const PancakeswapPriceMonitor = require('./prices/pancakeswap');
const ApeSwapArbitrageMonitor = require("./arbitrage/apeswap");
const BakeryswapArbitrageMonitor = require('./arbitrage/bakeryswap');
const PancakeswapArbitrageMonitor = require('./arbitrage/pancakeswap');


function startArbitrageMonitor(data) {

  if (data.buyingExchange === data.sellingExchange) {
    console.log('You cannot commit arbitrage on the same exchange');
    process.exit(1);
  }

  switch (data.buyingExchange) {
    case 'Apeswap':
      if (data.sellingExchange === 'Bakeryswap') {
        monitorApeBakeryArbitrage(data);
      }
      if (data.sellingExchange === 'Pancakeswap') {
        monitorApePancakeArbitrage(data);
      }
      break;
    case 'Bakeryswap':
      if (data.sellingExchange === 'Apeswap') {
        monitorBakeryApeArbitrage(data);
      }
      if (data.sellingExchange === 'Pancakeswap') {
        monitorBakeryPancakeArbitrage(data);
      }
      break;
    case 'Pancakeswap':
      if (data.sellingExchange === 'Apeswap') {
        monitorPancakeApeArbitrage(data);
      }
      if (data.sellingExchange === 'Bakeryswap') {
        monitorPancakeBakeryArbitrage(data);
      }
      break;
    default:

  }
}

function startPriceMonitor(data) {
  switch (data.exchange) {
    case 'Apeswap':
      monitorApeswapPairPrices(data);
      break;
    case 'Bakeryswap':
      monitorBakeryswapPairPrices(data);
      break;
    case 'Pancakeswap':
      monitorPancakeswapPairPrices(data);
      break;
    default:
  }
}

function monitorApeBakeryArbitrage(data) {
  return ApeSwapArbitrageMonitor.monitorApeBakeryArbitrage(data);
}

function monitorApePancakeArbitrage(data) {
  return ApeSwapArbitrageMonitor.monitorApePancakeArbitrage(data);
}

function monitorBakeryApeArbitrage(data) {
  return BakeryswapArbitrageMonitor.monitorBakeryApeArbitrage(data)
}

function monitorBakeryPancakeArbitrage(data) {
  return BakeryswapArbitrageMonitor.monitorBakeryPancakeArbitrage(data);
}

function monitorPancakeApeArbitrage(data) {
  return PancakeswapArbitrageMonitor.monitorPancakeApeArbitrage(data);
}

function monitorPancakeBakeryArbitrage(data) {
  return PancakeswapArbitrageMonitor.monitorPancakeBakeryArbitrage(data);
}

function monitorApeswapPairPrices(data) {
  return ApeswapPriceMonitor.monitorPrices(data);
}

function monitorBakeryswapPairPrices(data) {
  return BakeryswapPriceMonitor.monitorPrices(data);
}

function monitorPancakeswapPairPrices(data) {
  return PancakeswapPriceMonitor.monitorPrices(data);
}


module.exports = {
  arbitrage: {
    initArbitrageMonitor: function (data) {
      return startArbitrageMonitor(data);
    }
  },
  prices: {
    initPriceMonitor: function (data) {
      return startPriceMonitor(data);
    },
  },
}