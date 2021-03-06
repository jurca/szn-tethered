'use strict'

const del = require('del')
const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')

function compile() {
  return gulp
    .src('./szn-tethered.js')
    .pipe(babel({
      presets: [['@babel/preset-env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(rename({
      suffix: '.es3',
    }))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyES6Implementation,
  copyPackageMetaFiles,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(gulp.dest('./dist'))
}

function copyES6Implementation() {
  return gulp
    .src('./szn-tethered.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2015-compatible
    .pipe(rename('szn-tethered.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function minify() {
  return gulp
    .src('./dist/*.js')
    .pipe(babel({
      presets: [['minify', {builtIns: false}]],
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('./dist'))
}

function clean() {
  return del('./dist')
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compile,
    copy,
  ),
  minify,
)

