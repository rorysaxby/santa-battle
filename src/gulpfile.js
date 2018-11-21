'use strict';

/************************************************
- Required
*************************************************/

var gulp = require('gulp'),
	sass = require('gulp-sass'),
    rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	gulpUtil = require('gulp-util'),
    sourceMaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    autoPrefix = require('gulp-autoprefixer'),
    svgSprite = require('gulp-svg-sprite');

/************************************************
- Defaults
*************************************************/

var isHTMLTemplateStage = true;

var scssFiles = 'scss/**/*.scss',
    cssDest = '',
    scssAutoprefix = ['last 2 versions'];

var jsFiles = [
        'scripts/**/*.js'
    ],
    jsAll = 'script.js',
    cssDest = '../dist/css/',
    jsDest = '../dist/script/';

// SVG sprite config
var spriteConfig = {
    mode: {
        symbol: {
            dest: '../dist/icons/',
            sprite: 'icon-sprite.svg',
            example: true
        },
    },
    svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false
    }
};
var iconSrc = 'assets/icons/';

/************************************************
- Tasks
*************************************************/

// Compile SCSS for development with source maps
gulp.task('scss_dev', function () {
    return gulp.src(scssFiles)
        .pipe(sourceMaps.init())
        .pipe(sass.sync({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(sourceMaps.write({ includeContent: false, sourceRoot: '.' }))
        .pipe(sourceMaps.init({ loadMaps: true }))
        .pipe(autoPrefix({ browsers: scssAutoprefix, cascade: false }))
        .pipe(sourceMaps.write('.', { includeContent: false, sourceRoot: '/src' }))
        .pipe(gulp.dest(cssDest));
});

// Compile and minify SCSS for production
gulp.task('scss_prod', function () {
    return gulp.src(scssFiles)
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoPrefix({ browsers: scssAutoprefix, cascade: false }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(cssDest));
});

// Combine JS into single file for development with source maps
gulp.task('js_dev', function () {
    return gulp.src(jsFiles)
        .pipe(sourceMaps.init())
        .pipe(babel())
        .pipe(concat(jsAll))
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest(jsDest));
});

// Combine and minify JS for production
gulp.task('js_prod', function () {
    return gulp.src(jsFiles)
        .pipe(babel())
        .pipe(concat(jsAll))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(jsDest));
});

// SVG sprite generation
gulp.task('svg_sprite', function () {
    return gulp.src(iconSrc + '*.svg')
        .pipe(svgSprite(spriteConfig))
        .pipe(gulp.dest('.'));
});

// Watch task
gulp.task('watch', function () {
    gulp.watch([scssFiles, jsFiles], { interval: 100 }, ['scss_dev', 'js_dev']);
});

/************************************************
- Compile Tasks
*************************************************/

gulp.task('dev', ['scss_dev', 'js_dev', 'watch']);

gulp.task('prod', ['scss_prod', 'js_prod']);