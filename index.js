'use strict';

/* Libraries */
var config = require('./utils/config.js')
var express = require('express');
var del = require('del');
var bodyParser = require('body-parser');
var fs = require('fs');
var enums = require('./utils/enums.js');
var events = require("events");
var app = express();
var secrets = require('./utils/secret.js');
var evictor = require('./utils/evictor.js');
var pool = require('./utils/pool.js');

/* Constants */
var port = process.env.PORT || config.port;
var cpuNum = require('os').cpus().length;
console.log('CPUNUM:',cpuNum);

pool = pool(cpuNum - 1 || 1,'./utils/child.js')
evictor = evictor(config.evictInterval, pool);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });

app.get('/', function(req, res){
  res.render('customizer');
});

app.post('/', function(req, res){
  console.log('initiating');
  if(!req.body.config) {
    return;
  }
  var config = JSON.parse(req.body.config || '');
  var reqID = pool.newTask(config);
  evictor.new(reqID);
  var secret = secrets.NewSecret(reqID);
  res.send({reqID: reqID, secret: secret});
});

app.post('/check', function(req, res){
  console.log('checking');
  var reqID = req.body.reqID || 0;
  var secret = req.body.secret || 0;
  try{
    evictor.check(reqID);
  } catch(err) {
    res.send('Invalid');
    console.error(err);
    return;
  }
  if(!secrets.Validate(reqID, secret)) {
    res.send('Invalid');
  } else {
    var info = pool.checkTask(reqID);
    if (info.status === enums.TaskStatus.Done) {
      res.send('Done');
    } else if (info.status === enums.TaskStatus.Compiling) {
      res.send('Compiling');
    } else if (info.status === enums.TaskStatus.Waiting) {
      res.send('Waiting... No. '+info.number);
    } else if (info.status === enums.TaskStatus.Canceled) {
      res.send('Canceled');
    }
  }
});

app.post('/fetch', function(req, res){
  console.log('fetching');
  var filename = 'amazeui.tar';
  var reqID = req.body.reqID || 0;
  var secret = req.body.secret || 0;
  var path = __dirname + '/customizer/' + reqID + '/'
  if (secrets.Validate(reqID, secret)) {
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
        res.status(200).end();
      }
      fs.exists(path, function (exists) {
        if(exists){
          console.log('Path exists. Cleaning temp files.');
          setTimeout(function(){
            del(path);
            console.log(reqID.toString()+': Deleted');
          },4000);
        }
      });
    });
  } else {
    res.send('Invalid');
  }
});
app.listen(port);
