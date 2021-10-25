require('dotenv').config();
const ApeswapService = require('../marketfetcher/apeswap');
const BakeryswapService = require('../marketfetcher/bakeryswap');
const CMKService = require('../marketfetcher/cmk');
const DyDxService = require('../marketfetcher/dydx');
const KyberService = require('../marketfetcher/kyber');
const PancakeswapService = require('../marketfetcher/pancakeswap');
const SushiswapService = require('../marketfetcher/sushiswap');
const UniswapService = require('../marketfetcher/uniswap');


function fetchApeswapPairPrice(pair) {
  let data = {pair:pair};
  return ApeswapService.getAssetInfo(data);
}

function fetchBakeryswapPairPrice(pair) {
  let data = {pair:pair};
  return BakeryswapService.getAssetInfo(data);
}

function fetchUniswapPairPrice(exchange, network, tokenPair) {
  let data = {exchange: exchange, network: network, pair: tokenPair};
  return UniswapService.getAssetInfo(data);
}

function fetchKyberPairPrice(exchange, network, tokenPair) {
  let data = {exchange: exchange, network: network, pair: tokenPair};
  return KyberService.getAssetInfo(data);
}

function fetchSushiswapPairPrice(exchange, network, tokenPair) {
  let data = {exchange: exchange, network: network, pair: tokenPair};
  return SushiswapService.getAssetInfo(data);
}

function fetchPancakeswapPairPrice(pair) {
  let data = { pair: pair};
  return PancakeswapService.getAssetInfo(data);
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
    fetchSushiswapPairPrice: function(exchange, network, tokenPair) {
      return fetchSushiswapPairPrice(exchange, network, tokenPair);
    },
    fetchPancakeswapPairPrice: function(pair) {
      return fetchPancakeswapPairPrice(pair);
    },
    fetchBakeryswapPairPrice: function(pair) {
      return fetchBakeryswapPairPrice(pair);
    },
    fetchApeswapPairPrice: function(pair) {
      return fetchApeswapPairPrice(pair);
    }
  }
}

