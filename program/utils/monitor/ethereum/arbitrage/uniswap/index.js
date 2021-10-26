const monitoringProcess = require("child_process");

function uniKyMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/UniKyArbitrageMonitor.js', [], {silent: true});
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

function uniSushiMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/UniSushiArbitrageMonitor.js', [], {silent: true});
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
  monitorUniKyArbitrage: function (data) {
    return uniKyMonitor(data);
  },
  monitorUniSushiArbitrage: function (data) {
    return uniSushiMonitor(data);
  }
}