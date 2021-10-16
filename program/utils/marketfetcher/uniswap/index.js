require("dotenv").config()

const fetchProcess = require('child_process');
const pad = require("pad");
const colors = require("colors");

async function fetchData(data) {
  const process = fetchProcess.fork(__dirname+'/priceFetcher.js', [], {silent: true});
  process.send(data)
  process.stdout.on('data', function(standardOutData) {
    console.log(standardOutData.toString());
  });

  process.stderr.on('data', function(standardErrorData) {
    if(standardErrorData.toString().includes('Warning:')) {
    } else {
      console.log('Error: ' + standardErrorData );
    }
  });

  process.on('message', function(response) {
    console.log(pad(colors.red('Uniswap WETH Buy Price:'), 30), response.rate.buy);
    console.log(pad(colors.green('Uniswap WETH Sell Price:'), 30), response.rate.sell);
    process.send(data = false);
  });

  process.on('close', function(code, data) {
    console.log('Done. Closing ' + code);
  });
}

module.exports = {
  getAssetInfo: function(data) {
    return  fetchData(data);
  }
}