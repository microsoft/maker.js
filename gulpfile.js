var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');

var tsProject = ts.createProject({
    declarationFiles: true,
    noExternalResolve: true,
    out: 'maker.js'
});

gulp.task('compile-typescript', function () {

    var tsResult = gulp.src('src/**/*.ts')
                    .pipe(ts(tsProject));

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done.  
        tsResult.dts.pipe(gulp.dest('target/definitions')),
        tsResult.js
            .pipe(gulp.dest('target/js'))
            .pipe(rename('maker.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest('target/js'))
            
    ]);
});

gulp.task('default', ['compile-typescript']);
