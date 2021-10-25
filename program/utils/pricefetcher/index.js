const CMKService = require('../pricefetcher/vendors/cmk');
const DyDxService = require('../pricefetcher/ethereum/dydx');
const ApeswapService = require('../pricefetcher/binance/apeswap');
const BakeryswapService = require('../pricefetcher/binance/bakeryswap');
const UniswapService = require('../pricefetcher/ethereum/uniswap');
const KyberService = require('../pricefetcher/ethereum/kyber');
const SushiswapService = require('../pricefetcher/ethereum/sushiswap');
const PancakeswapService = require('../pricefetcher/binance/pancakeswap');


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
    binance: {
      fetchApeswapPairPrice: function(pair) {
        return fetchApeswapPairPrice(pair);
      },
      fetchBakeryswapPairPrice: function(pair) {
        return fetchBakeryswapPairPrice(pair);
      },
      fetchPancakeswapPairPrice: function(pair) {
        return fetchPancakeswapPairPrice(pair);
      }
    },
    ethereum: {
      fetchUniswapPairPrice: function(exchange, network, tokenPair) {
        return fetchUniswapPairPrice(exchange, network, tokenPair)
      },
      fetchKyberPairPrice: function(exchange, network, tokenPair) {
        return fetchKyberPairPrice(exchange, network, tokenPair)
      },
      fetchSushiswapPairPrice: function(exchange, network, tokenPair) {
        return fetchSushiswapPairPrice(exchange, network, tokenPair);
      },
    }
  }
}

