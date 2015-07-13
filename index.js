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
    cp = require('child_process'),
    ejs = require('ejs');
var app = express();

var globalCount = 0;



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });
app.get('/customizer', function(req, res){
  res.render('customizer');
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
