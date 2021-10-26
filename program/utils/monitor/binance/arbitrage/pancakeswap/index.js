const monitoringProcess = require("child_process");

function pancakeApeMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/PancakeApeArbitrageMonitor.js', [], {silent: true});
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
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  })
}

function pancakeBakeryMonitor(data) {
  const process = monitoringProcess.fork(__dirname + '/PancakeBakeryArbitrageMonitor.js', [], {silent: true});
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
  });

  process.on('close', function (code, data) {
    console.log('Done. Closing ' + code);
  })
}

module.exports = {
  monitorPancakeApeArbitrage: function(data){
    return pancakeApeMonitor(data);
  },
  monitorPancakeBakeryArbitrage: function(data){
    return pancakeBakeryMonitor(data);
  }
}