function apeBakeryMonitor(data) {

}

function apePancakeMonitor(data) {

}

module.exports = {
  monitorApeBakeryArbitrage: function(data){
    return apeBakeryMonitor(data);
  },
  monitorApePancakeArbitrage: function(data){
    return apePancakeMonitor(data);
  }
}