require('dotenv').config();
const _ = require('lodash');
const CMKService = require('../marketfetcher/cmk');
const DyDxService = require('../marketfetcher/dydx');
const UniswapService = require('../marketfetcher/uniswap');
const KyberService = require('../marketfetcher/kyber');



function fetchUniswapPairPrice(exchange, network, tokenPair) {
  let data = {exchange: exchange, network: network, pair: tokenPair};
  return UniswapService.getAssetInfo(data);
}

function fetchKyberPairPrice(exchange, network, tokenPair) {
  let data = {exchange: exchange, network: network, pair: tokenPair};
  return KyberService.getAssetInfo(data);
}

async function fetchCMKPrice(token) {
  return await CMKService.getAssetInfo(token, process.env.CMK_QUOTE_API_URL);
}

async function fetchDyDxPrice(token) {
  return await DyDxService.getAssetInfo(token, process.env.DYDX_V3_MARKETS_API_URL);
}



module.exports = {
  fetcher: {
    fetchUniswapPairPrice: function(exchange, network, tokenPair) {
      return fetchUniswapPairPrice(exchange, network, tokenPair)
    },
    fetchKyberPairPrice: function(exchange, network, tokenPair) {
      return fetchKyberPairPrice(exchange, network, tokenPair)
    },
  }
}

