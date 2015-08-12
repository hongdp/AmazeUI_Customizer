var cp = require('child_process');
var enums = require('./enums.js');
var util = require('util');
var events = require('events');
var del = require('del');
var fs = require('fs');


var pool = function (workerNum, src) {
  this._taskInfos = {};
  this._currentTaskID = 0;
  this._TaskQ = [];
  this._WorkerQ = [];
  this._idCount = 0;
  this.src = src;
  for (var i = 0; i < workerNum; i++) {
    var newWorker = cp.fork(this.src);
    this._WorkerQ.push(newWorker);
  }
};
pool.prototype._addNewWorker = function () {
  var newWorker = cp.fork(this.src);
  if (!this._TaskQ.length) {
    this._WorkerQ.push(newWorker);
  } else {
    while (!this._taskInfos[taskID]) {
      var taskID = this._TaskQ.shift();
    }
    var taskInfo = this._taskInfos[taskID];
    this._StartWorking(newWorker, taskInfo, taskID);
  }
};
pool.prototype._getTaskInfoByID = function (taskID) {
  if (!this._taskInfos[taskID]) {
    throw 'Checking taskInfo:' + taskID + 'Taskinfo doesn\'t exist.';
  }
  return this._taskInfos[taskID];
};
pool.prototype.checkTask = function (taskID) {
  try {
    var taskInfo = this._getTaskInfoByID(taskID);

  } catch (err) {
    console.warn(err);
    return {status: enums.TaskStatus.Canceled};
  }
  console.log('Status of task', taskID, ':', taskInfo.status);
  return {status: taskInfo.status, number: taskID - this._currentTaskID};
};

pool.prototype.newTask = function (args) {
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

pool.prototype.TaskInfo = function (args) {
  events.EventEmitter.call(this);
  this.status = enums.TaskStatus.Init;
  this.args = args;
};

pool.prototype._StartWorking = function (worker, taskInfo, taskID) {
  this._currentTaskID = taskID > this._currentTaskID ? taskID : this._currentTaskID;
  var msg = {
    type: enums.ToChildMsgTypes.Run,
    args: taskInfo.args,
    taskID: taskID
  };
  taskInfo.status = enums.TaskStatus.Compiling;
  worker.send(msg);
  worker.on('message', function (msg) {
    if (msg.type === enums.FromChildMsgTypes.Done && taskInfo.status === enums.TaskStatus.Compiling) {
      taskInfo.status = enums.TaskStatus.Done;
      this._RefreshWorker(worker, this);
    } else if (msg.type === enums.FromChildMsgTypes.Error) {
      taskInfo.status = enums.TaskStatus.Canceled;
      this._RefreshWorker(worker, this);
    }
  }.bind(this));
  taskInfo.on('cancel', function () {
    if (taskInfo.status === enums.TaskStatus.Canceled) {
      return;
    }
    console.warn('Task', taskID, ' is canceled');
    if (taskInfo.status === enums.TaskStatus.Compiling) {
      this._RefreshWorker(worker, this);
    }
    taskID.status = enums.TaskStatus.Canceled;
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

pool.prototype._RefreshWorker = function (worker, pool) {
  worker.kill();
  pool._addNewWorker();
}

pool.prototype.deleteTask = function (taskID) {
  if (!this._taskInfos[taskID]) {
    throw 'TaskInfos doesn\'t exist';
  }
  console.warn('Canceling task ', taskID);
  this._taskInfos[taskID].emit('cancel');
  delete this._taskInfos[taskID];
}

util.inherits(pool.prototype.TaskInfo, events.EventEmitter);


module.exports = function (cpuNum, src) {
  return new pool(cpuNum, src);
};
