const banner = require('./views/banner');
const setupHelper = require('./lib/helpers/setup');

async function run() {
  console.log(await showBanner());
  setupHelper.setup();
}

async function showBanner() {
  return new Promise((resolve, reject) => {
    banner.showBanner(resolve, reject)
  })
}

async function showLatestMarketInformation(){

}
module.exports = {
  program: {
     init: function() {
       run();
     }
  }

}