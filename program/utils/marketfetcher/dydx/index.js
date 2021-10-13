const axios = require("axios");
const _ = require('lodash');
const WebSocket = require('ws');
//const client = new WebSocket();


async function fetchData(token, url) {


  let dydxCon = new WebSocket('wss://api.dydx.exchange/v3/ws');
  dydxCon.onopen = function(env){
    console.log("connection avaialable");
    dydxCon.send('{"type":"subscribe","channel":"v3_markets"}')
  }

  dydxCon.onmessage = (env)=> {
    let stockObject = JSON.parse(env.data);
    console.log(stockObject.contents.markets);
    //dydxCon.close();
  }


//   const result = await axios.get('https://api.dydx.exchange/v1/index-price/WETH-DAI')
//     .then(function (response) {
// console.log(response)
//       // let markets = Object.keys(response.data.markets);
//       // _.forEach((markets), function (key) {
//       //   console.log(response.data.markets[key].indexPrice)
//       // })
//      return response.data.markets;
//     })
//     .catch(function (error) {
// // handle error
//       console.log(error);
//     })
//   console.log(result);
  //return getData(result);
}

function getData(response) {
  return response;
}

module.exports = {
  getAssetInfo: function(token, url) {
    return fetchData(token, url);
  }
}
