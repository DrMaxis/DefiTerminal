const axios = require("axios");


//const client = new WebSocket();


async function fetchData(token, url) {

  const result = await axios.get(url)
    .then(function (response) {
      if (token.symbol === 'ETH' || token.symbol === 'BTC') {
        return  {
          token: token.name,
          pair: token.symbol + ' / ' + 'USD',
          price: response.data.markets[token.symbol + '-USD'].indexPrice
        }
      }
    })
    .catch(function (error) {
      console.log(error);
    })
  return getData(result);
}

function getData(response) {
  return response;
}

module.exports = {
  getAssetInfo: function (token, url) {
    return fetchData(token, url);
  }
}
