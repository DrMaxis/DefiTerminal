const fetchProcess = require('child_process');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");

async function swap(data) {
  const process = fetchProcess.fork(__dirname + '/apeswapTokenSwapper.js', [], {silent: true});
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
    console.log(`Transaction hash: ${response.transactionHash}`);

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