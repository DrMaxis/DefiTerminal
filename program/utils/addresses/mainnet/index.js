const kyberMainnet = require('./kyber-mainnet.json');
const uniswapMainnet = require('./uniswap-mainnet.json');
const dydxMainnet = require('./dydx-mainnet.json');
const tokensMainnet = require('./tokens-mainnet.json');
const tokenPairsMainnet = require('./token-pairs-mainnet.json');
const suishiswapMainnet = require('./sushiswap-mainnet.json');

module.exports = {
  mainnet: {
    kyber: kyberMainnet,
    uniswap: uniswapMainnet,
    sushiswap: suishiswapMainnet,
    dydx: dydxMainnet,
    tokens: tokensMainnet,
    tokenPairs: tokenPairsMainnet
  }
};
