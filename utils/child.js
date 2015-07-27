'use strict';
var Customizer = require('./tools/tasks');
var enums = require('./enums.js')
process.on('message', function(msg) {
  if(msg.type === enums.ToChildMsgTypes.Run) {
    console.log('Child started');
    var successCallback = function() {
      process.send({type: enums.FromCHildMsgTypes.Done});
    }
    var errorCallback = function() {
      process.send({type: enums.FromCHildMsgTypes.Error});
    }
    var customizerInst = new Customizer(msg.args, msg.taskID, successCallback, errorCallback);
    // console.log("GOING TO RUN")
    customizerInst.run();
  }
  
});
console.log('Child is sending ready');
process.send({type: enums.FromCHildMsgTypes.Ready});
