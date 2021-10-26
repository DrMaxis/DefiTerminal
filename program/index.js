const banner = require('./views/banner');
const programStarter = require('./lib');

async function run() {
  //console.log(await showBanner());
  programStarter.start();
}

async function showBanner() {
  return new Promise((resolve, reject) => {
    banner.showBanner(resolve, reject)
  })
}

module.exports = {
  program: {
     init: function() {
       run();
     }
  }

}