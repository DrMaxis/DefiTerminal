const {Command} = require('commander');
const program = new Command();
const interactiveProgram = require('./interactive');
const interactiveMarketFetcher = require('./interactive/market')
const interactiveMarket = require("./interactive/market");
const interactiveArbitrage = require("./interactive/arbitrage");


function startProgram() {
  if(process.argv.length <=2 ) {
    interactiveProgram.init();
  } else {
    // start interactive cli
    program
      .command('interactive')
      .alias('-i')
      .description('Interactive')
      .action(function () {
        interactiveProgram.init();
      });

    // Get market data
    program
      .command('prices')
      .alias('pcs')
      .description('Get Latest Market Data')
      .action(function () {
        interactiveMarket.init();
      });

    // Preform Arbitrage
    program
      .command('arbitrage')
      .alias('a')
      .description('Preform Arbitrage')
      .action(function () {
        interactiveArbitrage.init();
      });

    program
      .command('swap')
      .alias('swp')
      .description('Preform Swap')
      .action(function () {
        //swapHelper.swap();
      });

    program.parse(process.argv);
  }

}
exports.start = () => {
  startProgram();
}