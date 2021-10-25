const binanceDirections = require('./binance/binance-directions.json');
const ethereumDirections = require('./ethereum/ethereum-directions.json');

module.exports = {
 directions: {
   ethereum: ethereumDirections,
   binance: binanceDirections
 }
};
