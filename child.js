var Customizer = require('./tools/tasks');

process.on('message', function(msg) {
  console.log('Child started');
  var customizerInst = new Customizer(msg.config, msg.requestID, function(cb) {
    process.send('done');
    cb();
  });
  // console.log(customizerInst.config);
  customizerInst.init();
  // console.log("GOING TO RUN")
  customizerInst.run();
});
console.log('Child is sending ready');
process.send('ready');
