const {Command} = require('commander');
const program = new Command();
const interactiveProgram = require('./interactive');


function startProgram() {
  if (process.argv.length <= 2) {
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

    program.parse(process.argv);
  }

}

exports.start = () => {
  startProgram();
}