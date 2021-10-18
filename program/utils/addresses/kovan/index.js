const kyberKovan = require('./kyber-kovan.json');
const uniswapKovan = require('./uniswap-kovan.json');
const dydxKovan = require('./dydx-kovan.json');
const tokensKovan = require('./tokens-kovan.json');
const tokenPairsKovan = require('./token-pairs-kovan.json');
const sushiswapKovan = require('./suishiswap-kovan.json');
module.exports = {
    kovan: {
        kyber: kyberKovan,
        uniswap: uniswapKovan,
        sushiswap: sushiswapKovan,
        dydx: dydxKovan,
        tokens: tokensKovan,
        tokenPairs: tokenPairsKovan
    }
};