var randomPassword = require('./randomPassword.js');

function SecretKeeper() {
  this.Infos = {};
}

SecretKeeper.prototype.NewSecret = function(id) {
  if(this.Infos[id]) {
    throw 'Secret already exists.'
  }
  this.Infos[id] = randomPassword();
  return this.Infos[id];
};


SecretKeeper.prototype.Validate = function(id, secret) {
  //console.log(id);
  //console.log(this.Infos);
  if(!this.Infos[id]) {
    throw 'Secret doesn\'t exist.'
  }
  return (this.Infos[id] === secret);
};

module.exports = new SecretKeeper;
