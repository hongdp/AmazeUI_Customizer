'use strict';
var express = require('express');
var del = require('del');
var bodyParser = require('body-parser');
var fs = require('fs');
var enums = require('./utils/enums.js');
var events = require("events");
var app = express();
var secrets = require('./utils/secret.js');
var poolConstructor = require('./utils/pool.js');
var port = process.env.PORT || 3000;

var cpuNum = require('os').cpus().length;
var pool = new poolConstructor(cpuNum - 1 || 1,'./utils/child.js');

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
  var filename = 'amazeui.tar';

  if(req.body.type === 'config'){
    console.log('configuring');
    var config = JSON.parse(req.body.config || '');
    var reqID = pool.newTask(config);
    var secret = secrets.NewSecret(reqID);
    res.send({reqID: reqID, secret: secret});
  } else if (req.body.type === 'check') {
    console.log('checking');
    var reqID = req.body.reqID;
    var secret = req.body.secret;
    if(!secrets.Validate(reqID, secret)) {
      res.send('Invalid');
    }
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
  } else if (req.body.type === 'fetch') {
    console.log('fetching');
    var reqID = req.body.reqID;
    var secret = req.body.secret;
    //console.log(req.body);
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

    }
  }
});

app.listen(port);
