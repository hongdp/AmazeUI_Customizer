'use strict';
var Customizer = require('./tools/tasks');

process.on('message', function(msg) {
  console.log('Child started');
  var successCallback = function() {
    process.send('done');
  }
  var errorCallback = function() {
  	process.send('error');
  }
  var customizerInst = new Customizer(msg.config, msg.requestID, successCallback, errorCallback);
  // console.log("GOING TO RUN")
  customizerInst.run();
});
console.log('Child is sending ready');
process.send('ready');
