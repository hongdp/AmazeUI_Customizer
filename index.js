var express = require('express'),
    path = require('path'),
    del = require('del'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    errorHandler = require('errorhandler'),
    fs = require('fs'),
    Customizer = require('./tools/tasks'),
    cp = require('child_process');
var app = express();

var globalCount = 0;



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/customizer', function(req, res){
  res.send('<form action="" method="post"><input value="{&quot;style&quot;:[&quot;ui.component.less&quot;,&quot;animation.less&quot;,&quot;ui.modal.less&quot;,&quot;close.less&quot;,&quot;variables.less&quot;,&quot;mixins.less&quot;,&quot;base.less&quot;],&quot;js&quot;:[&quot;ui.dimmer.js&quot;,&quot;core.js&quot;,&quot;ui.modal.js&quot;,&quot;ui.pinchzoom.js&quot;,&quot;ui.scrollspy.js&quot;,&quot;ui.smooth-scroll.js&quot;,&quot;ui.sticky.js&quot;],&quot;widgets&quot;:[{&quot;name&quot;:&quot;slider&quot;,&quot;theme&quot;:[&quot;slider.default.less&quot;]}]}" name="config" id="cst-config" type="hidden"> <button type="submit" id="amz-compile" download="amazeui.tar.gz" class="am-btn am-btn-success">下载定制配置文件</button></form>')
});

app.post('/customizer', function(req, res){
  var childMsg = {};
  var requestID = globalCount++;
  childMsg.requestID = requestID;
  childMsg.config = JSON.parse(req.body.config);
  var child = cp.fork('child.js');
  var path = __dirname + '/customizer/' + requestID.toString() + '/';
  child.on('message', function(m){
    if (m === 'ready') {
      console.log('Child is ready');
      child.send(childMsg);
    } else if (m === 'done') {
      var filename = "amazeui.tar.gz";
      console.log(requestID.toString()+'FINISHED');
      res.download(path+filename, filename, function(err) {
        if (err) {
          console.log(err);
          if (err.status) {
            res.status(err.status).end();
          } else {
            res.status(404).end();
          }

        }
        else {
          console.log('Sent:', filename);
          res.status(200).end()
        }
        child.kill();
        fs.exists(path, function (exists) {
          if(exists){
            console.log('Path exists. Cleaning temp files.')
            setTimeout(function(){
              del(path);
              console.log(requestID.toString()+": Deleted")
            },5000);
          }
        });
      });
    }
  });

  req.on('close', function(){
    console.log('Connection lost. Killing process.')
    child.kill();
    fs.exists(path, function (exists) {
      if (exists) {
        console.log('Path exists. Cleaning temp files.')
        setTimeout(function () {
          del(path);
          console.log(requestID.toString() + ": Deleted")
        }, 5000);
      }
    });
  })

});

app.listen(8000);
