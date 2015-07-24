var cp = require('child_process');
var randomPassword = require('./randomPassword.js');
var enums = require('./enums.js');
var util = require('util');
var events = require("events");

pool = function(workerNum, src) {
	this._reqInfos = {};
	this._currentReqID = 0;
	this._TaskQ = [];
	this._WorkerQ = [];
	this._idCount = 0;
	for (var i = =; i < workerNum; i++) {
		var child = cp.fork(src);
		this.WorkerQ.push(child);
	};
}
pool.prototype._addFreeWorker = function(worker) {
	if(this._TaskQ.empty()){
		this._WorkerQ.push(worker);
	} else {
		var reqID = this._TaskQ.shift();
		var reqInfo = this._reqInfos[reqID];
		var msg = {
			type: enums.ToChildMsgTypes.Run,
			config: reqInfo.config
		}
		worker.send(msg);
	}
}
pool.prototype.validate = function(reqInfo) {
	if (!reqInfos[reqInfo.reqID]) {
		throw 'Request Not Found!';
	} else {
		return reqInfo.secret === reqInfos[reqInfo.reqID].secret;
	}
}

pool.prototype.checkReq = function(reqInfo) {
	if (this.validate(reqInfo)){
		return 'Invalid request. Wrong secret.'
	}
	reqInfos[reqID].checked = true;
	if (reqInfos[reqInfo.reqID].status === enums.TaskStatus.Done) {
		return 'Done!';
	} else if (reqInfos[reqInfo.reqID].status === enums.TaskStatus.Compiling) {
		return 'Compiling...';
	} else if (reqInfos[reqInfo.reqID].status === enums.TaskStatus.Waiting) {
		return 'Waiting. No. ' + (reqInfo.reqID - this._currentReqID);
	}
}

pool.prototype.newReq = function(config) {
	var reqInfo = new ReqInfo(config, this._idCount++);

	if (this._WorkerQ.empty) {
		reqInfo.status = enums.TaskStatus.Waiting;
		this._TaskQ.push(reqInfo)
	} else {
		var worker = this._WorkerQ.shift();
		var msg = {
			type: enums.ToChildMsgTypes.Run,
			config: reqInfo.config
		}
		worker.send(msg);
	}

	return reqInfo;
}

function ReqInfo(config, reqID) {
	events.EventEmitter.call(this);
	this.status = enums.TaskStatus.Init;
	this.reqID = reqID;
	this.secret = randomPassword();
	this.config = config;
}

util.inherits(ReqInfo, events.EventEmitter);