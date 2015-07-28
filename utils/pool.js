var cp = require('child_process');
var enums = require('./enums.js');
var util = require('util');
var events = require('events');
var del = require('del');
var fs = require('fs');
pool = function(workerNum, src) {
	this._taskInfos = {};
	this._currentTaskID = 0;
	this._TaskQ = [];
	this._WorkerQ = [];
	this._idCount = 0;
	this.src = src;
	for (var i = 0; i < workerNum; i++) {
		this._addNewWorker();
	}
	setInterval(function() {
		for(var i in this._taskInfos) {
      if(!this._taskInfos.hasOwnProperty(i)){
        continue;
      }
			if(!this._taskInfos[i].checked){
        console.warn('Canceling task ', i);
				this._taskInfos[i].emit('cancel');
				delete this._taskInfos[i];
			} else {
        this._taskInfos[i].checked = false;
      }
		}
  }.bind(this), 2000)
};
pool.prototype._addNewWorker = function() {
  var newWorker = cp.fork(this.src);
	if(!this._TaskQ.length){
		this._WorkerQ.push(newWorker);
	} else {
		while (!this._taskInfos[taskID]) {
			var taskID = this._TaskQ.shift();
		}
		var taskInfo = this._taskInfos[taskID];
		this._StartWorking(newWorker, taskInfo, taskID);
	}
};
pool.prototype._getTaskInfoByID = function(taskID) {
	if(!this._taskInfos[taskID]) {
		throw 'Checking taskInfo:' + taskID + 'Taskinfo doesn\'t exist.';
	}
	return this._taskInfos[taskID];
};
pool.prototype.checkTask = function(taskID) {
	try {
		var taskInfo = this._getTaskInfoByID(taskID);

	} catch(err) {
		console.warn(err);
		return enums.TaskStatus.Canceled;
	}
	taskInfo.checked = true;
  console.log('Status of task', taskID, ':', taskInfo.status);
	return {status: taskInfo.status, number: taskID - this._currentTaskID};
};

pool.prototype.newTask = function(args) {
	var taskInfo = new this.TaskInfo(args);
	var taskID = this._idCount++;
  this._taskInfos[taskID] = taskInfo;
	if (!this._WorkerQ.length) {
		taskInfo.status = enums.TaskStatus.Waiting;
		this._TaskQ.push(taskID);
	} else {
		var worker = this._WorkerQ.shift();
		this._StartWorking(worker, taskInfo, taskID);
	}
	return taskID;
};

pool.prototype.TaskInfo = function(args) {
	events.EventEmitter.call(this);
  this.checked = true;
	this.status = enums.TaskStatus.Init;
	this.args = args;
};

pool.prototype._StartWorking = function(worker, taskInfo, taskID) {
  this._currentTaskID = taskID > this._currentTaskID ? taskID : this._currentTaskID;
	var msg = {
		type: enums.ToChildMsgTypes.Run,
		args: taskInfo.args,
		taskID: taskID
	};
  taskInfo.status = enums.TaskStatus.Compiling;
	worker.send(msg);
	worker.on('message', function(msg) {
		if (msg.type === enums.FromChildMsgTypes.Done) {
      taskInfo.status = enums.TaskStatus.Done;
			RefreshWorker(worker, this);
		}
  }.bind(this));
	taskInfo.on('cancel', function() {
    console.warn('Task', taskID, ' is canceled')
    taskID.status = enums.TaskStatus.Canceled;
		 RefreshWorker(worker, this);
    var path = __dirname + '/../customizer/' + taskID + '/';
    fs.exists(path, function (exists) {
      if (exists) {
        console.log('Path exists. Cleaning temp files.');
        setTimeout(function () {
          del(path);
          console.log(taskID.toString() + ': Deleted');
        }, 4000);
      }
    });
  }.bind(this))


};

function RefreshWorker(worker, pool) {
  worker.kill();
  pool._addNewWorker();
}


util.inherits(pool.prototype.TaskInfo, events.EventEmitter);
module.exports = pool;
