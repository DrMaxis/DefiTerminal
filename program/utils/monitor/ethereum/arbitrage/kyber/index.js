const monitoringProcess = require("child_process");

function kyUniMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/KyUniArbitrageMonitor.js', [], {silent: true});
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

function kySushiMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/KySushiArbitrageMonitor.js', [], {silent: true});
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
  monitorKySushiArbitrage: function(data){
    return kySushiMonitor(data);
  },
  monitorKyUniArbitrage: function(data){
    return kyUniMonitor(data);
  }
}