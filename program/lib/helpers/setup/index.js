const {Command} = require('commander');
const program = new Command();
const swapHelper = require('../../../scripts/swap');
const marketHelper = require('../../../scripts/market');
const arbitrageHelper = require('../../../scripts/arbitrage');
const interactiveProgram = require('../setup/interactive');
const {fetcher} = require('../../../utils/marketfetcher')


function setupProgram() {
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
        marketHelper.latest();
      });

    // Preform Arbitrage
    program
      .command('arbitrage')
      .alias('a')
      .description('Preform Arbitrage')
      .action(function () {
        arbitrageHelper.arbitrage();
      });

    program
      .command('swap')
      .alias('swp')
      .description('Preform Swap')
      .action(function () {
        swapHelper.swap();
      });

    program.parse(process.argv);
  }

}
exports.setup = () => {
  setupProgram();
}