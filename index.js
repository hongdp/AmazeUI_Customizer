var express = require('express');
    express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    errorHandler = require('errorhandler'),
    fs = require('fs'),
    customizer = require('./tools/tasks')
var app = express();

var globalCount = 0;



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/customizer', function(req, res){
  res.send('<form action="" method="post"><input value="{&quot;style&quot;:[&quot;ui.component.less&quot;,&quot;animation.less&quot;,&quot;ui.modal.less&quot;,&quot;close.less&quot;,&quot;variables.less&quot;,&quot;mixins.less&quot;,&quot;base.less&quot;],&quot;js&quot;:[&quot;ui.dimmer.js&quot;,&quot;core.js&quot;,&quot;ui.modal.js&quot;,&quot;ui.pinchzoom.js&quot;,&quot;ui.scrollspy.js&quot;,&quot;ui.smooth-scroll.js&quot;,&quot;ui.sticky.js&quot;],&quot;widgets&quot;:[{&quot;name&quot;:&quot;slider&quot;,&quot;theme&quot;:[&quot;slider.default.less&quot;]}]}" name="config" id="cst-config" type="hidden"> <button type="submit" id="amz-compile" download="amazeui.tar.gz" class="am-btn am-btn-success">下载定制配置文件</button></form>')
})
app.post('/customizer', function(req, res){
  var requestID = globalCount++;
  console.log(req.body.config);
  var customizerInst = new customizer(JSON.parse(req.body.config), requestID, function(cb){
    var filename = "amazeui.tar.gz";
    var path = __dirname + '/customizer/' + requestID.toString() + '/';
    console.log(requestID.toString()+'FINISHED');
    res.download(path+filename, filename, function(err){
      if (err) {
        console.log(err);
        res.status(err.status).end();
      }
      else {
        console.log('Sent:', filename);
        res.status(200).end()
      }
      cb();
    })
  });
  // console.log(customizerInst.config);
  customizerInst.init();
  // console.log("GOING TO RUN")
  customizerInst.run();
  


});

app.listen(8000);