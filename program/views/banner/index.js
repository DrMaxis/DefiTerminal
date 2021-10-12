const decorator = require('figlet');

function displayBanner(resolve, reject) {

  decorator.text('AFX', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
  }, function(err, data) {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      reject(err);
    }
    resolve(data);
  })
}
exports.showBanner = function (resolve, reject) {
  displayBanner(resolve, reject);
}
