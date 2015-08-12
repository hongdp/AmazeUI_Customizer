var reqCheckedStatus = {};


evictor = function (interval, pool) {
  if (!interval) {
    return;
  }
  setInterval(function () {
    console.log(reqCheckedStatus);
    for (var i in reqCheckedStatus) {
      if (!reqCheckedStatus.hasOwnProperty(i)) {
        continue;
      }
      if (!reqCheckedStatus[i]) {
        try {
          pool.deleteTask(i);
        } catch (err) {
          console.error(err);
        }
        delete reqCheckedStatus[i];
      } else {
        reqCheckedStatus[i] = false;
      }
    }
  }, interval);
};

evictor.prototype.new = function (id) {
  if (reqCheckedStatus.hasOwnProperty(id)) {
    throw 'Request already exists in the evictor.';
  }
  reqCheckedStatus[id] = true;
};

evictor.prototype.delete = function (id) {
  if (!reqCheckedStatus.hasOwnProperty(id)) {
    throw 'Request doesn\'t exist in the evictor.';
  }
  delete reqCheckedStatus[id];
};

evictor.prototype.check = function (id) {
  if (!reqCheckedStatus.hasOwnProperty(id)) {
    throw 'Request doesn\'t exist in the evictor.';
  }
  reqCheckedStatus[id] = true;
};

module.exports = function (interval, pool) {
  return new evictor(interval, pool);
};
