var cp = require('child_process');
var enums = require('./enums.js');
var util = require('util');
var events = require("events");

pool = function(workerNum, src) {
	this._taskInfos = {};
	this._currentTaskID = 0;
	this._TaskQ = [];
	this._WorkerQ = [];
	this._idCount = 0;
	this.src = src;
	for (var i = 0; i < workerNum; i++) {
		var child = cp.fork(src);
		this._WorkerQ.push(child);
	}
	setInterval(function() {
		for(var i in this._taskInfos) {
      if(!this._taskInfos.hasOwnProperty(i)){
        continue;
      }
			if(!this._taskInfos[i].checked){
				this._taskInfos[i].emit('cancle');
				delete this._taskInfos[i];
			}
		}
  }.bind(this), 2000)
};
pool.prototype._addFreeWorker = function(worker) {
	if(this._TaskQ.length){
		this._WorkerQ.push(worker);
	} else {
		while (!this._taskInfos[taskID]) {
			var taskID = this._TaskQ.shift();
		}
		var taskInfo = this._taskInfos[taskID];
		StartWorking(worker, taskInfo, taskID);
	}
};
pool.prototype._getTaskInfoByID = function(taskID) {
	if(!this._taskInfos[taskID]) {
		throw 'Taskinfo doesn\'t exist.'
	}
	return this._taskInfos[taskID];
};
pool.prototype.checkTask = function(taskID, secret) {
	try {
		var taskInfo = this._getTaskInfoByID(taskID);

	} catch(err) {
		console.warn(err);
		return enums.TaskStatus.Cancled;
	}
	taskInfo.checked = true;
	return taskInfo.status;
};

pool.prototype.newTask = function(args) {
	var taskInfo = new this.TaskInfo(args);
	var taskID = this._idCount++;
	if (this._WorkerQ.length) {
		taskInfo.status = enums.TaskStatus.Waiting;
		this._TaskQ.push(taskID);
	} else {
		var worker = this._WorkerQ.shift();
		this._StartWorking(worker, taskInfo, taskID);
	}
	return taskInfo;
};

pool.prototype.TaskInfo = function(args) {
	events.EventEmitter.call(this);
	this.status = enums.TaskStatus.Init;
	this.args = args;
};

pool.prototype._StartWorking = function(worker, taskInfo, taskID) {
	var msg = {
		type: enums.ToChildMsgTypes.Run,
		args: taskInfo.args,
		taskID: taskID
	};
	worker.send(msg);
	worker.on('message', function(msg) {
		if (msg.type === enums.FromCHildMsgTypes.Done) {
			RefreshWorker(worker, this);
			callback();
		}
	});
	taskInfo.on('cancle', function() {
		 RefreshWorker(worker, this);
	})


};

function RefreshWorker(worker, pool) {
  worker.kill();
  var newWorker = cp.fork(this.src);
  pool._addFreeWorker(newWorker);
}


util.inherits(pool.prototype.TaskInfo, events.EventEmitter);
module.exports = pool;
