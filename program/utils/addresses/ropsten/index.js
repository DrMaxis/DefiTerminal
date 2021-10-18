const kyberRopsten = require('./kyber-ropsten.json');
const uniswapRopsten = require('./uniswap-ropsten.json');
const dydxRopsten = require('./dydx-ropsten.json');
const tokensRopsten = require('./tokens-ropsten.json');
const tokenPairsRopsten = require('./token-pairs-ropsten.json');
const sushiswapRopsten = require('./suishiswap-ropsten.json');

module.exports = {
  ropsten: {
    kyber: kyberRopsten,
    uniswap: uniswapRopsten,
    sushiswap: sushiswapRopsten,
    dydx: dydxRopsten,
    tokens: tokensRopsten,
    tokenPairs: tokenPairsRopsten,
  }
};
