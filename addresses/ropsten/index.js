const kyberRopsten = require('./kyber-ropsten.json');
const uniswapRopsten = require('./uniswap-ropsten.json');
const dydxRopsten = require('./dydx-ropsten.json');
const tokensRopsten = require('./tokens-ropsten.json');

module.exports = {
    ropsten: {
        kyber: kyberRopsten,
        uniswap: uniswapRopsten,
        dydx: dydxRopsten,
        tokens: tokensRopsten
    }
};
