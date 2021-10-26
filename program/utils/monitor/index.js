const binanceMonitor = require('./binance');
const ethereumMonitor = require('./ethereum');



module.exports = {
  binance: binanceMonitor,
  ethereum: ethereumMonitor
}