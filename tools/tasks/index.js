/* jshint node: true */
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var format = require('util').format;
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');
var runSequence = require('run-sequence');
var $ = require('gulp-load-plugins')();
var collapser = require('bundle-collapser/plugin');
var file = require('../lib/file');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');


var Customizer = function(customizeConfig, ID, callback){
  this.cstmzPath = path.join(__dirname, '../../customizer/', ID.toString(), '/dist');
  this.cstmzTmp = path.join(__dirname, '../../customizer/', ID.toString(), '/.cstmz-tmp');
  this.DEFAULTS = {
    dist: this.cstmzPath,
    tmp: this.cstmzTmp,
    js: path.join(this.cstmzTmp, 'js/amazeui.custom.js'),
    less: path.join(this.cstmzTmp, 'less/amazeui.custom.less'),
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
    "style": [
      "variables.less",
      "mixins.less",
      "base.less",
      "grid.less",
      "button.less",
      "icon.less"
    ],
    "js": [
      "core.js"
    ],
    "widgets": [
      {
        "name": "header",
        "theme": ["header.default.less"]
      }
    ]
  }

  this.less = [
    '@import "variables.less";',
    '@import "mixins.less";',
    '@import "base.less";'
  ];
  this.js = [
    'require("core");'
  ];
  this.gulp = require('gulp');
  this.ID = ID;
  this.callback = callback;
  console.log(this.config);
}



// ATTENTION: Adding ID to task name to avoid the problems happened when running same task multiple times.
//            I'm not sure if this causes efficiency problems.
//
Customizer.prototype.init = function(){
  'use strict';


  this.gulp.task('customizer:preparing'+this.ID.toString(), function(callback) {
    console.log("customizer:preparing"+this.ID.toString());

    this.config.style.forEach(function(file) {
      this.less.push(format('@import "%s";', file));

    }.bind(this));

    this.config.js.forEach(function(file) {
      this.js.push(format('require("%s");', file));
    }.bind(this));

    // widgets
    if (this.config.widgets) {
      if (this.config.widgets.length) {
        this.DEFAULTS.widgetBase.forEach(function(base) {
          this.less.push(format('@import "%s";', base));
        }.bind(this));
      }

      this.config.widgets.forEach(function(widget) {
        this.js.push(format('require("%s/src/%s");', widget.name, widget.name));
        this.less.push(format('@import "../../../../widget/%s/src/%s.less";',
          widget.name, widget.name));
        var pkg = require(path.join('../../widget', widget.name, 'package.json'));
        pkg.styleDependencies.forEach(function(dep) {
          this.less.push(format('@import "%s";', dep));
        }.bind(this));

        if (widget.theme) {
          widget.theme.forEach(function(theme) {
            console.log(theme);
            this.less.push(format('@import "../../../../widget/%s/src/%s";', widget.name,
              theme));
          }.bind(this));
        }
      }.bind(this));
    }

    file.write(this.DEFAULTS.less, _.uniq(this.less).join('\n'));
    file.write(this.DEFAULTS.js, _.uniq(this.js).join('\n'));

    callback();
  }.bind(this));

  this.gulp.task('customizer:less'+this.ID.toString(), function() {
    console.log("customizer:less"+this.ID.toString());
    this.gulp.src(this.DEFAULTS.less)
      .pipe($.less({
        paths: [
          path.join(__dirname, '../../less')
        ]
      }))
      .pipe($.autoprefixer({
        browsers: this.config.AUTOPREFIXER_BROWSERS ||
        this.DEFAULTS.AUTOPREFIXER_BROWSERS
      }))
      .pipe(this.gulp.dest(this.cstmzPath))
      .pipe($.size({showFiles: true, title: 'source'}))
      .pipe($.minifyCss({noAdvanced: true}))
      .pipe($.rename({
        suffix: '.min',
        extname: '.css'
      }))
      .pipe(this.gulp.dest(this.cstmzPath))
      .pipe($.size({showFiles: true, title: 'minified'}))
      .pipe($.size({showFiles: true, gzip: true, title: 'gzipped'}));
  }.bind(this));

  this.gulp.task('customizer:js'+this.ID.toString(), function() {
    console.log("customizer:js"+this.ID.toString());
    return browserify({
      entries: this.DEFAULTS.js,
      paths: [path.join(__dirname, '../../js'), path.join(__dirname, '../../widget')]
    }).plugin(collapser).bundle()
      .pipe(source('amazeui.custom.js'))
      .pipe(buffer())
      .pipe(this.gulp.dest(this.cstmzPath))
      .pipe($.uglify({
        output: {
          ascii_only: true
        }
      }))
      .pipe($.rename({suffix: '.min'}))
      .pipe(this.gulp.dest(this.cstmzPath))
      .pipe($.size({showFiles: true, title: 'minified'}))
      .pipe($.size({showFiles: true, gzip: true, title: 'gzipped'}));
  }.bind(this));

  this.gulp.task('customizer:clean'+this.ID.toString(), function(cb) {
    console.log("customizer:clean"+this.ID.toString());
    del(this.DEFAULTS.tmp);

    setTimeout(function(){
      del(this.DEFAULTS.dist+"/..", cb);
      console.log(this.ID.toString()+": Deleted")
    }.bind(this),10000);
  }.bind(this));


  this.gulp.task('customizer:callback'+this.ID.toString(), this.callback);



  this.gulp.task('customizer:compress'+this.ID.toString(), function() {
    console.log("customizer:compress"+this.ID.toString());
    return this.gulp.src(path.join(this.DEFAULTS.dist, '*'))
        .pipe(tar('amazeui.tar'))
        .pipe(gzip())
        .pipe(this.gulp.dest(this.DEFAULTS.dist+"/.."));
  }.bind(this));


  this.gulp.task('customizer'+this.ID.toString(), function(cb) {
    runSequence(
      'customizer:preparing'+this.ID.toString(),
      ['customizer:less'+this.ID.toString(), 'customizer:js'+this.ID.toString()],
      'customizer:compress'+this.ID.toString(),
      'customizer:callback'+this.ID.toString(),
      'customizer:clean'+this.ID.toString(),
      cb);
  }.bind(this));


}


Customizer.prototype.run = function() {
  // console.log("RUNNNNNNNNNNNNNNNNNNNNING");
  // gulp.task('customize',['customizer']);
  this.gulp.start('customizer'+this.ID.toString());
};

module.exports = Customizer;
