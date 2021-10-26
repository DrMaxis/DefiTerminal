const monitoringProcess = require("child_process");

function bakeryPancakeMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/BakeryPancakeArbitrageMonitor.js', [], {silent: true});
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
  })
}

function bakeryApeMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/BakeryApeArbitrageMonitor.js', [], {silent: true});
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
  })
}

module.exports = {
  monitorBakeryApeArbitrage: function(data){
    return bakeryApeMonitor(data);
  },
  monitorBakeryPancakeArbitrage: function(data){
    return bakeryPancakeMonitor(data);
  }
}