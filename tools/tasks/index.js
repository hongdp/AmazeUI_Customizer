/* jshint node: true */
var path = require('path');
var _ = require('lodash');
var format = require('util').format;
var browserify = require('browserify');
var UglifyJS = require('uglify-js');
var collapser = require('bundle-collapser/plugin');
var file = require('../lib/file');
var fs = require('fs');
var tar = require('tar');
var fstream = require('fstream');
var less = require('less');
var cleanCSS = require('clean-css')
var autoprefixer = require('autoprefixer-core');
var postcss = require('postcss');

var customizer = function(customizeConfig, ID, successCallback, errorCallback){
  'use strict';
  this.counter = 1;
  this.cstmzPath = path.join(__dirname, '../../customizer/', ID.toString(), '/dist');
  this.cstmzTmp = path.join(__dirname, '../../customizer/', ID.toString(), '/.cstmz-tmp');
  this.DEFAULTS = {
    dist: this.cstmzPath,
    tmp: this.cstmzTmp,
    js: path.join(this.cstmzTmp, 'js/amazeui.custom.js'),
    // less: path.join(this.cstmzTmp, 'less/amazeui.custom.less'),
    AUTOPREFIXER_BROWSERS: [
      'ie >= 8',
      'ie_mob >= 10',
      'ff >= 30',
      'chrome >= 34',
      'safari >= 7',
      'opera >= 23',
      'ios >= 7',
      'android >= 2.3',
      'bb >= 10'
    ],
    widgetBase: [
      'variables.less',
      'mixins.less',
      'base.less',
      'grid.less',
      'block-grid.less',
      'icon.less',
      'utility.less'
    ]
  };
  this.config = customizeConfig||{
    'style': [
      'variables.less',
      'mixins.less',
      'base.less',
      'grid.less',
      'button.less',
      'icon.less'
    ],
    'js': [
      'core.js'
    ],
    'widgets': [
      {
        'name': 'header',
        'theme': ['header.default.less']
      }
    ]
  };

  this.less = [
    '@import "variables.less";',
    '@import "mixins.less";',
    '@import "base.less";'
  ];
  this.js = [
    'require("core");'
  ];
  this.ID = ID;
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;
  //console.log(this.config);
};



// ATTENTION: Adding ID to task name to avoid the problems happened when running same task multiple times.
//            I'm not sure if this causes efficiency problems.
//
customizer.prototype.init = function(){
  'use strict';

  this.config.style.forEach(function(file) {
    this.less.push(format('@import "%s";', file));
  }.bind(this));

  this.config.js.forEach(function(file) {
    this.js.push(format('require("%s");', file));
  }.bind(this));

  if (this.config.widgets) {
    if (this.config.widgets.length) {
      this.DEFAULTS.widgetBase.forEach(function(base) {
        this.less.push(format('@import "%s";', base));
      }.bind(this));
    }

    this.config.widgets.forEach(function(widget) {
      this.js.push(format('require("%s/src/%s");', widget.name, widget.name));
      this.less.push(format('@import "../widget/%s/src/%s.less";',
        widget.name, widget.name));
      var pkg = require(path.join('../../widget', widget.name, 'package.json'));
      pkg.styleDependencies.forEach(function(dep) {
        this.less.push(format('@import "%s";', dep));
      }.bind(this));

      if (widget.theme) {
        widget.theme.forEach(function(theme) {
          console.log(theme);
          this.less.push(format('@import "../widget/%s/src/%s";', widget.name,
            theme));
        }.bind(this));
      }
    }.bind(this));
  }

  // file.write(this.DEFAULTS.less, _.uniq(this.less).join('\n'));
  file.write(this.DEFAULTS.js, _.uniq(this.js).join('\n'));
};

customizer.prototype.runJS = function(){
  'use strict';
  console.log('js started');
  var bundleStream = browserify({
    entries: this.DEFAULTS.js,
    paths: [path.join(__dirname, '../../js'), path.join(__dirname, '../../widget')]
  }).plugin(collapser).bundle().on('error', function(err){
    console.error(err);
    this.errorCallback();
    this.emit('end');
  }.bind(this));
  
  var bundleFile = '';
  bundleStream.on('data', function(data){
    bundleFile += data;
  })
  .on('end', function(){
    // // console.log(this.DEFAULTS.js);
    // var ast = UglifyJS.parse(bundleFile);
    // ast.figure_out_scope();
    // var compressor = UglifyJS.Compressor();
    // ast = ast.transform(compressor);
    try{
      var code = UglifyJS.minify(bundleFile, {
        output: {
          ascii_only: true
        },
        fromString: true
      }).code; // get compressed code
    } catch(e) {
      console.error(e);
      this.errorCallback();
    }
    
    file.write(path.join(this.cstmzPath, 'amazeui.custom.min.js'), code);
    file.write(path.join(this.cstmzPath, 'amazeui.custom.js'), bundleFile);
    this.counter-- || this.packup('js');
  }.bind(this));

};

customizer.prototype.runLess = function(){
  'use strict';
  console.log('less started.');
  var options = {
    paths: [
      path.join(__dirname, '../../less')
    ],
    compress: false
  };
  var prefixOpts = {
    browsers: this.config.AUTOPREFIXER_BROWSERS ||
    this.DEFAULTS.AUTOPREFIXER_BROWSERS
  }

  // console.log('start rendering');
  // console.log(this.less);
  less.render(_.unique(this.less).join('\n'), options, function(error, output) {

    if(error){
      console.log('ERROR: ', error.message);
      this.errorCallback();
      return;
    }
    // console.log(path.join(this.cstmzPath, 'amazeui.custom.css'));
    postcss([autoprefixer(prefixOpts)]).process(output.css, {map: false}).then(function (result) {
      result.warnings().forEach(function (warn) {
          console.warn(warn.toString());
      });
      console.log('autoprefixer');
      file.write(path.join(this.cstmzPath, 'amazeui.custom.css'), result.css);
      var minified = new cleanCSS().minify(result.css).styles;
      file.write(path.join(this.cstmzPath, 'amazeui.custom.min.css'), minified);
      this.counter-- || this.packup('less');
    }.bind(this));
  }.bind(this));

};

customizer.prototype.packup = function(msg){
  'use strict';
  console.log('from ', msg);
  var dirDest = fs.createWriteStream(path.join(this.cstmzPath, '../amazeui.tar'));
  function onError(err) {
    console.error('An error occurred:', err);
    this.errorCallback();
  }

  function onEnd() {
    this.successCallback();
  };

  var packer = tar.Pack({ noProprietary: true })
    .on('error', onError)
    .on('end', onEnd.bind(this));

  // This must be a "directory"
  fstream.Reader({ path: this.cstmzPath, type: 'Directory' })
    .on('error', onError)
    .pipe(packer)
    .pipe(dirDest)

};

customizer.prototype.run = function() {
  'use strict';
  // console.log('RUNNNNNNNNNNNNNNNNNNNNING');
  // gulp.task('customize',['customizer']);
  this.init()
  console.log(this.cstmzPath);
  this.runLess();
  this.runJS();
  // this.gulp.start('customizer'+this.ID.toString());
};

module.exports = customizer;
