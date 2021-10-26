const monitoringProcess = require("child_process");


function sushiUniMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/SushiUniArbitrageMonitor.js', [], {silent: true});
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
    console.log('response:', response)
    //process.send(data = false);
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  });
}

function sushiKyMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/SushiKyArbitrageMonitor.js', [], {silent: true});
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
    console.log('response:', response)
    //process.send(data = false);
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  });
}

module.exports = {
  monitorSushiKyArbitrage: function(data){
    return sushiKyMonitor(data);
  },
  monitorSushiUniArbitrage: function(data){
    return sushiUniMonitor(data);
  }
}