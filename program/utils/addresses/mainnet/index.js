const kyberMainnet = require('./kyber-mainnet.json');
const uniswapMainnet = require('./uniswap-mainnet.json');
const dydxMainnet = require('./dydx-mainnet.json');
const tokensMainnet = require('./tokens-mainnet.json');
const tokenPairsMainnet = require('./token-pairs-mainnet.json');
const suishiswapMainnet = require('./sushiswap-mainnet.json');
const apeswapMainnet  = require('./apeswap-mainnet.json');
const bakeryswapMainnet = require('./bakeryswap-mainnet.json');
const pancakeswapMainnet = require('./pancakeswap-mainnet.json');

module.exports = {
  mainnet: {
    kyber: kyberMainnet,
    uniswap: uniswapMainnet,
    sushiswap: suishiswapMainnet,
    dydx: dydxMainnet,
    apeswap: apeswapMainnet,
    bakeryswap: bakeryswapMainnet,
    pancakeswap: pancakeswapMainnet,
    tokens: tokensMainnet,
    tokenPairs: tokenPairsMainnet
  }
};
