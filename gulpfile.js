'use strict';

const babel = require('gulp-babel');

// const browserify = require('browserify');

const browserSync = require('browser-sync');

const browserSyncJasmine = browserSync.create('jasmine');

const browserSyncNode = browserSync.create('nodemon');

// const coveralls = require('gulp-coveralls');

const eslint = require('gulp-eslint');

const gulp = require('gulp');

// const istanbul = require('gulp-istanbul');

// const jasmine = require('gulp-jasmine');

// const cover = require('gulp-coverage');

const nodemon = require('gulp-nodemon');

const os = require('os');

const plumber = require('gulp-plumber');

const nodejsPort = Math.floor((Math.random() * 1000) + 3000);

// const jasminePort = Math.floor((Math.random() * (5999 - 5000 + 1)) + 5000);

const browser = os.platform() === 'linux' ? 'google-chrome' : (
  os.platform() === 'darwin' ? 'google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox')
);

// we'd need a slight delay to reload browsers
// connected to browser-sync after restarting nodemon
const BROWSER_SYNC_RELOAD_DELAY = 2000;

//gulp jshint code testing
// lint covearge ['*.js', './src/js/*.js', './src/jasmine/spec/*.js', './src/public/js/*.js']
gulp.task('lint', () => {
  return gulp.src(['./src/js/*.js', './src/jasmine/spec/*.js',])
    .pipe(eslint()) 
    .pipe(eslint.format());
});

gulp.task('istanbul', function () {
  // return gulp.src(['src/public/js/app.js'])
  //   .pipe(istanbul({includeUntested: true}))
  //   .pipe(istanbul.hookRequire());
});

gulp.task('jasmine', ['istanbul'], function () {
  // return gulp.src('src/jasmine/spec/inverted-index-test_spec.js')
  //   .pipe(jasmine())
  //   .pipe(istanbul.writeReports({
  //     reporters: [ 'lcov' ],
  //   }))
  //   .on('end', function(){
  //     gulp.src('/coverage/lcov.info')
  //     .pipe(coveralls());
  //   })
});

// run the nodemon server reload
gulp.task('nodemon', (cb) => {
  let started = false;
  return nodemon({
    script: './bin/www',
    watch: ['app.js', 'gulpfile.js'],
    env: {'PORT': nodejsPort, 'NODE_ENV': 'development' }
  })
  .on('start', function () {
    //have nodemon run watch on start
    // to avoid nodemon being started multiple times
    // thanks @matthisk
    if (!started) {
      cb();
      started = true; 
    } 
  })
  .on('restart', function onRestart() {
    // reload connected browsers after a slight delay
    setTimeout(function reload() {
      browserSyncNode.reload({
        stream: false
      });
      browserSyncJasmine.reload({
        stream: false
      });
    }, BROWSER_SYNC_RELOAD_DELAY);
  });
});

// run browsersync after nodemon runs
gulp.task('browser-sync', ['scripts'], () => {
  browserSyncNode.init(null, {
    online: false,
    proxy: 'http://localhost:' + nodejsPort,
    browser: browser,
    port: 4000,
    ui: {
      port: 4001
    }
  });
});

// run browsersync for jasmine tests
gulp.task('browser-sync-jasmine', () => {
  browserSyncJasmine.init(null, {
    online: false,
    browser: browser,
    server: {
      baseDir: "./",
      index: "src/jasmine/SpecRunner.html"
    },
    port: 9000,
    ui: {
      port: 9001
    }
  });
});

// reload browsers
gulp.task('bs-reload', function () {
  browserSyncNode.reload();
});

// reload browsers for scss changes
gulp.task('css', () => {
  return gulp.src('src/public/css/*.css')
    .pipe(browserSyncNode.reload({ stream: true }));
});

// convert es5 to es6
gulp.task('scripts', ['lint'], () => {
  return gulp.src('src/js/*.js')
  .pipe(plumber({
    errorHandler: () => {
      this.emit('end');
    }
  }))
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(gulp.dest('src/public/js/'))
  .pipe(browserSyncNode.reload({ stream: true }));
});

// gulp default tasks
gulp.task('default', ['nodemon', 'browser-sync', 'browser-sync-jasmine'], () => {
  gulp.watch(['src/js/*.js'], ['scripts']);
  gulp.watch(['src/jasmine/*.js', 'src/jasmine/spec/*.js'], browserSyncJasmine.reload);
  gulp.watch(['src/sass/*.scss', 'src/public/**/*.css'], ['css']);
  gulp.watch(['src/views/*.jade', 'src/public/js/*.js'], ['bs-reload']);
});
