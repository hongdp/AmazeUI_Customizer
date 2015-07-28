'use strict';
var Customizer = require('../tools/tasks');
var enums = require('./enums.js')
process.on('message', function(msg) {
  console.log(msg);
  if(msg.type === enums.ToChildMsgTypes.Run) {
    console.log('Child started');
    var successCallback = function() {
      process.send({type: enums.FromChildMsgTypes.Done});
    }
    var errorCallback = function() {
      process.send({type: enums.FromChildMsgTypes.Error});
    }
    var customizerInst = new Customizer(msg.args, msg.taskID, successCallback, errorCallback);
    // console.log("GOING TO RUN")
    try {
      customizerInst.run();
    }
    catch(err) {
      console.error(err);
    }
  }

});
console.log('Child is sending ready');
process.send({type: enums.FromChildMsgTypes.Ready});
