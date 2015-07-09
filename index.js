var express = require('express');
    express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    errorHandler = require('errorhandler'),
    fs = require('fs');

var app = express();

var globalCount = 0;



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/customizer', function(req, res){
  res.send('<form action="" method="post"><input value="{&quot;style&quot;:[&quot;variables.less&quot;,&quot;mixins.less&quot;,&quot;base.less&quot;],&quot;js&quot;:[&quot;core.js&quot;],&quot;widgets&quot;:[]}" name="config" id="cst-config" type="hidden"> <button type="submit" id="amz-compile" download="amazeui.tar.gz" class="am-btn am-btn-success">下载定制配置文件</button></form>')
})
app.post('/customizer', function(req, res){
  var requestID = globalCount++;
  console.log(req.body.config);
  var customizer = require('./tools/tasks/');
  customizer.init(JSON.parse(req.body.config), requestID, function(){
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
    })
  });
  console.log("GOING TO RUN")
  customizer.run();
  


});

app.listen(8000);