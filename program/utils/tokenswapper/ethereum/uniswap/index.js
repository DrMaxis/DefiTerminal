const fetchProcess = require('child_process');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");

async function swap(data) {
  const process = fetchProcess.fork(__dirname + '/uniswapTokenSwapper.js', [], {silent: true});
  process.send(data)
  process.stdout.on('data', function (standardOutData) {
    console.log(standardOutData.toString());
  });

  process.stderr.on('data', function (standardErrorData) {
    if (standardErrorData.toString().includes('Warning:')) {
    } else {
      console.log('Error: ' + standardErrorData);
    }
  });

  process.on('message', function (response) {



    process.send(data = false);
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  });
}

module.exports = {
  swapTokens: function (data) {
    return swap(data);
  }
}