/// <binding ProjectOpened='watch-app-code' />

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var argv = require('yargs').default('configuration', 'Debug').argv

gulp.task('watch-app-code', done => {
    gulp.watch('./app-code-js/*.js', gulp.series('build-app-code'));
    done();
});

gulp.task('build-app-code', done => {

    ///var isRelease = true; ///argv.configuration === 'Release';
    var isRelease = true;
    gulp.src([
        './app-code-js/a.js'
    ])
    .pipe(gulpif(!isRelease, sourcemaps.init({
        loadMaps: true
    })))
    .pipe(gulpif(!isRelease, sourcemaps.write('./', {
        includeContent: false,
        sourceRoot: '/app-code-ts/'
    })))
    ///.pipe(gulpif(isRelease, uglify()))
    ///.on('error', function (err) {
    ///    console.error('Error in uglify task', err.toString());
    ///})
    .pipe(gulp.dest('./js'));
    done();
});

gulp.task('build-libs', done => {
    gulp.src([
        'node_modules/knockout/build/output/knockout-latest.js'
    ])
        .pipe(concat('l.js'))
        .pipe(gulp.dest('./js'));
    done();
});



