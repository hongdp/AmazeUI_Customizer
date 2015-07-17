var Customizer = require('./tools/tasks');
var config = require('./tools/tasks/config.simple.json')

var customizerInst = new Customizer(config, 0, function(cb) {
	console.log('Test done');
});

customizerInst.init();
customizerInst.run();
