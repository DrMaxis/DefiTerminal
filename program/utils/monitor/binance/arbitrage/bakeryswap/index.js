function bakeryPancakeMonitor(data) {

}

function bakeryApeMonitor(data) {

}

module.exports = {
  monitorBakeryApeArbitrage: function(data){
    return bakeryApeMonitor(data);
  },
  monitorBakeryPancakeArbitrage: function(data){
    return bakeryPancakeMonitor(data);
  }
}