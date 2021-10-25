
const fetchProcess = require('child_process');

async function monitor(data) {
  const process = fetchProcess.fork(__dirname + '/sushiswapPriceMonitor.js', [], {silent: true});
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

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  });
}

module.exports = {
  monitorPrices: function (data) {
    return monitor(data);
  }
}