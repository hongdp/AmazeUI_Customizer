'use strict';
var express = require('express');
var del = require('del');
var bodyParser = require('body-parser');
var fs = require('fs');
var enums = require('./utils/enums.js');
var events = require("events");
var app = express();

var port = process.env.PORT || 8000;


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
  var childMsg = {};
  var requestID = globalCount++;
  var filename = 'amazeui.tar';
  childMsg.requestID = requestID;
  childMsg.config = JSON.parse(req.body.config || '');
  
  var path = __dirname + '/customizer/' + requestID.toString() + '/';

  var KillAndClean = function(){
    console.log('Connection lost. Killing process.');
    child.kill();
    fs.exists(path, function (exists) {
      if (exists) {
        console.log('Path exists. Cleaning temp files.');
        setTimeout(function () {
          del(path);
          console.log(requestID.toString() + ': Deleted');
        }, 5000);
      }
    });
  }

  var CloseConnection = function() {

  }

  if(req.body.type === 'config'){
    var child = cp.fork('child.js');

    res.send({ID: requestID, secret: secret});
    req.on('close', KillAndClean);
  } else if (req.body.type === 'check') {

    fs.exists(path+filename, function(exist) {
      res.send(exist ? 'Done' : 'Compiling');
    })
  } else if (req.body.type === 'fetch') {
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
            console.log(requestID.toString()+': Deleted');
          },4000);
        }
      });
    });
  }

  child.on('message', function(m){
    if (m === 'ready') {
      console.log('Child is ready');
      child.send(childMsg);
    } else if (m === 'done') {
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
          res.status(200).end();
        }
        child.kill();
        fs.exists(path, function (exists) {
          if(exists){
            console.log('Path exists. Cleaning temp files.');
            setTimeout(function(){
              del(path);
              console.log(requestID.toString()+': Deleted');
            },5000);
          }
        });
      });
    } else if (m === 'error'){
      console.error('Error occured! Closing connection.');
      res.status(404).end();
      KillAndClean();
    }
  });

  

});

app.listen(port);
