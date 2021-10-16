const rp = require('request-promise');

 async function fetchInfo(token, url) {
  const requestOptions = {
    method: 'GET',
    uri: url,
    qs: {
      'id': token.id,
    },
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMK_API_KEY,
    },
    json: true,
    gzip: true
  };

  const result = await rp(requestOptions).then(response => {
    return  {
      token: token.name,
      pair: 'USD' + ' / '+ token.symbol,
      price: response.data[token.id].quote['USD'].price
    };
  }).catch((err) => {
    console.log('API call error:', err.message);
  });
  return getData(result);
}
   function getData(response) {
    return response
}

module.exports = {
  getAssetInfo: function (token, url) {
     return fetchInfo(token, url);
  }
}