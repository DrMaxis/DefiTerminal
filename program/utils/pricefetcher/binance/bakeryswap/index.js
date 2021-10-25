const fetchProcess = require('child_process');
const pad = require("pad");
const colors = require("colors");
const moment = require("moment");

async function fetchData(data) {
  const process = fetchProcess.fork(__dirname + '/bakeryswapPriceFetcher.js', [], {silent: true});
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

    console.log(pad(colors.yellow('Current I/O Values as of '), 30),
      moment().format('ll') + ' ' + moment().format('LTS'));

    console.log(
      pad(colors.red('Token In:'), 30), response.tokenIn.name,
      pad(colors.red('Value: '), 30), response.tokenIn.value
    );
    console.log(
      pad(colors.green('Token Out: '), 30), response.tokenOut.name,
      pad(colors.green('Value Out: '), 30), response.tokenOut.value)
    ;


    process.send(data = false);
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  });
}

module.exports = {
  getAssetInfo: function (data) {
    return fetchData(data);
  }
}