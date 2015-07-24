'use strict';
var Customizer = require('./tools/tasks');
var enums = require('./enums.js')
process.on('message', function(msg) {
  if(msg.type === enums.ToChildMsgTypes.Run)
  console.log('Child started');
  var successCallback = function() {
    process.send({enums.FromCHildMsgTypes.Done});
  }
  var errorCallback = function() {
  	process.send({enums.FromCHildMsgTypes.Error});
  }
  var customizerInst = new Customizer(msg.config, msg.requestID, successCallback, errorCallback);
  // console.log("GOING TO RUN")
  customizerInst.run();
});
console.log('Child is sending ready');
process.send({enums.FromCHildMsgTypes.Ready});
