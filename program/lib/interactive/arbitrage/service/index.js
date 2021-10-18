const arbitrageProcess = require("child_process");
const pad = require("pad");
const colors = require("colors");


function arbitrage(data) {

// determine exchanges
  if((data.buyingExchange === 'Sushiswap' && data.sellingExchange === 'Uniswap') ||
    (data.buyingExchange === 'Uniswap' && data.sellingExchange === 'Sushiswap')) {
    runSushiUniArbitrage(data);
  }

  if((data.buyingExchange === 'Kyber' && data.sellingExchange === 'Uniswap') ||
    (data.buyingExchange === 'Uniswap' && data.sellingExchange === 'Kyber')){
    runKyUniArbitrage(data);
  }

}

function runSushiUniArbitrage(data) {
  const process = arbitrageProcess.fork(__dirname+'/SushiUniArbitrage.js', [], {silent: true});
  process.send(data)
  process.stdout.on('data', function(standardOutData) {
    console.log(standardOutData.toString());
  });

  process.stderr.on('data', function(standardErrorData) {
    if(standardErrorData.toString().includes('Warning:')) {
    } else {
      console.log('Error: ' + standardErrorData );
    }
  });

  process.on('message', function(response) {
    console.log('response:', response)
    //process.send(data = false);
  });

  process.on('close', function(code, data) {
    console.log('Done. Closing ' + code);
  });
}

function runKyUniArbitrage(data) {

  const process = arbitrageProcess.fork(__dirname+'/KyUniArbitrage.js', [], {silent: true});
  process.send(data)
  process.stdout.on('data', function(standardOutData) {
    console.log(standardOutData.toString());
  });

  process.stderr.on('data', function(standardErrorData) {
    if(standardErrorData.toString().includes('Warning:')) {
    } else {
      console.log('Error: ' + standardErrorData );
    }
  });

  process.on('message', function(response) {
    console.log('response:', response)
    //process.send(data = false);
  });

  process.on('close', function(code, data) {
    console.log('Done. Closing ' + code);
  });
}



module.exports = {
  runArbitrage: function(data) {
    arbitrage(data);
  },

}