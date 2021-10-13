require('dotenv').config();
const _ = require('lodash');
const {tokens} = require('../tokens');
const CMKService = require('../marketfetcher/cmk');
const DyDxService = require('../marketfetcher/dydx')


async function fetchTokenData(token) {
let CMKData,DyDxData;
  if(token.symbol === _.toUpper('weth')) {
    CMKData = await CMKService.getAssetInfo(token, process.env.CMK_QUOTE_API_URL);
    DyDxData = await DyDxService.getAssetInfo(token, process.env.DYDX_V2_MARKETS_API_URL);
  }
   // CMKData = await CMKService.getAssetInfo(token);
   // DyDxData = await DyDxService.getAssetInfo(token);
  console.log(DyDxData);
  // let result = {
  //   CMKData: CMKData,
  //   DyDxData: DyDxData
  // }
 // return   {
 //   CMKPrice: CMKService.getAssetInfo(token),
 //   // DyDxPrice: fetchDyDxPrice(token),
 //   // UniswapPrice: fetchUniswapPrice(token),
 //   // KyberPrice: fetchKyberPrice(token)
 // }

}
function fetchAllTokens() {
  _.forEach(tokens, function(token) {
    fetchTokenData(token)
  })
}



module.exports = {
  fetcher: {
    latest: function() {
      fetchAllTokens();

    },
    single: function() {

    },
    multiple: function() {

    }
  }
}

