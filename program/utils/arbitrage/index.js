const arbitrageProcess = require("child_process");

function startBinanceArbitrage(data) {

  if (data.buyingExchange === data.sellingExchange) {
    console.log('You cannot commit aribitrage on the same exchange');
    process.exit(1);
  }

  switch (data.buyingExchange) {
    case 'Apeswap':
      if (data.sellingExchange === 'Bakeryswap') {
        runApeBakeryArbitrage(data);
      }
      if (data.sellingExchange === 'Pancakeswap') {
        runApePancakeArbitrage(data);
      }
      break;
    case 'Bakeryswap':
      if (data.sellingExchange === 'Apeswap') {
        runBakeryApeArbitrage(data);
      }
      if (data.sellingExchange === 'Pancakeswap') {
        runBakeryPancakeArbitrage(data);
      }
      break;
    case 'Pancakeswap':
      if (data.sellingExchange === 'Apeswap') {
        runPancakeApeArbitrage(data);
      }
      if (data.sellingExchange === 'Bakeryswap') {
        runPancakeBakeryArbitrage(data);
      }
      break;
  }
}


function startEthereumArbitrage(data) {

  if (data.buyingExchange === data.sellingExchange) {
    console.log('You cannot commit aribitrage on the same exchange');
    process.exit(1);
  }

  switch (data.buyingExchange) {
    case 'Kyber':
      if (data.sellingExchange === 'Uniswap') {
        runKyUniArbitrage(data);
      }
      if (data.sellingExchange === 'Sushiswap') {
        runKySushiArbitrage(data);
      }
      break;
    case 'Sushiswap':
      if (data.sellingExchange === 'Kyber') {
        runSushiKyArbitrage(data);
      }
      if (data.sellingExchange === 'Uniswap') {
        runSushiUniArbitrage(data);
      }
      break;
    case 'Uniswap':
      if (data.sellingExchange === 'Kyber') {
        runUniKyArbitrage(data);
      }
      if (data.sellingExchange === 'Sushiswap') {
        runUniSushiArbitrage(data);
      }
      break;
  }
}

function runApeBakeryArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/ApeBakeryArbitrage.js', [], {silent: true});
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

function runApePancakeArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/ApePancakeArbitrage.js', [], {silent: true});
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

function runBakeryApeArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/BakeryApeArbitrage.js', [], {silent: true});
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

function runBakeryPancakeArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/BakeryPancakeArbitrage.js', [], {silent: true});
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

function runPancakeApeArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/PancakeApeArbitrage.js', [], {silent: true});
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

function runPancakeBakeryArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'binance/PancakeBakeryArbitrage.js', [], {silent: true});
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


function runKyUniArbitrage(data) {

  const process = arbitrageProcess.fork(__dirname + 'ethereum/KyUniArbitrage.js', [], {silent: true});
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

function runKySushiArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'ethereum/KySushiArbitrage.js', [], {silent: true});
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

function runSushiUniArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + '/SushiUniArbitrage.js', [], {silent: true});
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

function runSushiKyArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'ethereum/SushiKyArbitrage.js', [], {silent: true});
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

function runUniKyArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'ethereum/UniKyArbitrage.js', [], {silent: true});
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

function runUniSushiArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname + 'ethereum/UniSushiArbitrage.js', [], {silent: true});
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
  binance: {
    runArbitrage: function (data) {
      return startBinanceArbitrage(data);
    }

  },
  ethereum: {
    runArbitrage: function (data) {
      return startEthereumArbitrage(data);
    }
  }
}