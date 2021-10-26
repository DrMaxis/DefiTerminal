const KyberPriceMonitor = require('./prices/kyber');
const KyUniArbitrageMonitor = require('./arbitrage/kyber/');
const KySushiArbitrageMonitor = require('./arbitrage/kyber/');
const UniKyArbitrageMonitor = require('./arbitrage/uniswap/');
const UniSushiArbitrageMonitor = require('./arbitrage/uniswap/');
const UniswapPriceMonitor = require('./prices/uniswap');
const SushiKyArbitrageMonitor = require('./arbitrage/sushiswap/');
const SushiUniArbitrageMonitor = require('./arbitrage/sushiswap/');
const SushiswapPriceMonitor = require('./prices/sushiswap');

function startArbitrageMonitor(data) {

  if (data.buyingExchange === data.sellingExchange) {
    console.log('You cannot commit arbitrage on the same exchange');
    process.exit(1);
  }

  switch (data.buyingExchange) {
    case 'Kyber':
      if (data.sellingExchange === 'Sushiswap') {
        monitorKySushiArbitrage(data);
      }
      if (data.sellingExchange === 'Uniswap') {
        monitorKyUniArbitrage(data);
      }
      break;
    case 'Sushiswap':
      if (data.sellingExchange === 'Kyber') {
        monitorSushiKyArbitrage(data);
      }
      if (data.sellingExchange === 'Uniswap') {
        monitorSushiUniArbitrage(data);
      }
      break;
    case 'Uniswap':
      if (data.sellingExchange === 'Kyber') {
        monitorUniKyArbitrage(data);
      }
      if (data.sellingExchange === 'Sushiswap') {
        monitorUniSushiArbitrage(data);
      }
      break;
    default:

  }
}

function startPriceMonitor(data) {
  switch (data.exchange) {
    case 'Kyber':
      monitorKyberPairPrices(data);
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

function monitorKyUniArbitrage(data) {
return KyUniArbitrageMonitor.monitorKyUniArbitrage(data);
}

function monitorKySushiArbitrage(data) {
return KySushiArbitrageMonitor.monitorKySushiArbitrage(data)
}

function monitorUniKyArbitrage(data) {
return UniKyArbitrageMonitor.monitorUniKyArbitrage(data)
}

function monitorSushiUniArbitrage(data) {
return SushiUniArbitrageMonitor.monitorSushiUniArbitrage(data);
}

function monitorSushiKyArbitrage(data) {
return SushiKyArbitrageMonitor.monitorSushiKyArbitrage(data);
}

function monitorUniSushiArbitrage(data) {
return UniSushiArbitrageMonitor.monitorUniSushiArbitrage(data);
}

function monitorKyberPairPrices(data) {
  return KyberPriceMonitor.monitorPrices(data);
}

function monitorSushiswapPairPrices(data) {
  return SushiswapPriceMonitor.monitorPrices(data);
}

function monitorUniswapPairPrices(data) {
  return UniswapPriceMonitor.monitorPrices(data);
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