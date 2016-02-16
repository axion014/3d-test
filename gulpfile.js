var del = require("del");
var fs = require("fs");
var gulp = require('gulp');
var concat = require('gulp-concat');
var jsonminify = require('gulp-jsonminify');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var webserver = require("gulp-webserver");
gulp.task('default', ['compile']);
gulp.task('watch', ['compile'], function() {
	gulp.watch(['src/**/*'], ['compile']);
});
gulp.task('live', ['watch'], function() {
	gulp.src('.')
	.pipe(plumber())
	.pipe(webserver({open: true, livereload: {
		enable: true, filter: function(filename) {return !filename.match(/src/);}
	}}))
});
gulp.task('server', ['watch', 'open']);
gulp.task('open', function() {
	gulp.src('.')
	.pipe(plumber())
	.pipe(webserver({open: true, livereload: {enable: true, filter: function(filename) {return false;}}}))
});
gulp.task('compile', function() {
	var scripts = fs.readFileSync('src/config.txt').toString().split('\n');
	for ( var i = 0; i < scripts.length; ++i ) {
		scripts[i] = 'src/' + scripts[i];
	}
	gulp.src(scripts)
	.pipe(plumber())
	.pipe(concat('flygame.js'))
	.pipe(gulp.dest('./build/'))

	gulp.src(scripts)
	.pipe(plumber())
	.pipe(uglify())
	.pipe(concat('flygame.min.js'))
	.pipe(gulp.dest('./build/'));
})
gulp.task('jsonminify', function() {
	del.sync(['data/**/*.min.json']);
	gulp.src(['data/**/*.json'])
	.pipe(jsonminify())
	.pipe(rename({extname: '.min.json'}))
	.pipe(gulp.dest('./data/'));
	console.log('ok');
});
