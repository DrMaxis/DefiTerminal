function pancakeApeMonitor(data) {

}

function pancakeBakeryMonitor(data) {

}

module.exports = {
  monitorPancakeApeArbitrage: function(data){
    return pancakeApeMonitor(data);
  },
  monitorPancakeBakeryArbitrage: function(data){
    return pancakeBakeryMonitor(data);
  }
}