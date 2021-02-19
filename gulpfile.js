const { series, parallel } = require('gulp');
var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');

// minimist
var envOptions = {
    string: 'env',
    default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions);
console.log(options)

// clean
gulp.task('clean', function () {
    // 寫入./tmp及./public資料夾
    return gulp.src(['./.tmp', './public'], { read: false, allowEmpty: true })
        .pipe($.clean());
});

// copyHTML
gulp.task('copyHTML', function () {
    // 任務內容
    return gulp.src('./source/**/*.html')
        // gulp.src(''資料來源)
        .pipe(gulp.dest('./public/'))
    // .pipe(gulp.dest('輸出位置))
})

// jade
gulp.task('jade', function () {
    // var YOUR_LOCALS = {};

    return gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            // locals: YOUR_LOCALS
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});

// sass
$.sass.compiler = require('node-sass');

gulp.task('sass', function () {
    // 給予一個新的套件於sass任務中
    // ! 說明
    // ! 宣告plugin變數，autoprefixer針對最新兩版的瀏覽器來優化
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', '>5%'] })
    ];

    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        // sass已經完成編譯
        // 引用plugin套件
        .pipe($.postcss(plugins))
        // .pipe($.if(條件式, 壓縮function))
        .pipe($.if(options.env === 'production', $.minifyCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream())
});

// Babel
gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);

// bower
gulp.task('bower', function () {
    return gulp.src(mainBowerFiles())
        // 將輸出的檔案存到暫存資料夾
        .pipe(gulp.dest('./.tmp/vendors'))
});

// 將bower下載下來的js檔案合併到public資料夾中(串接)
gulp.task('vendorJs', function () {
    return gulp.src('./.tmp/vendors/**/*.js')
        // $.concat('合併後的檔案名稱')
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/js'))
});

// bowser-sync
gulp.task('browser-sync', function () {
    return browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

// imagemin
gulp.task('imagemin', () => (
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
));

// watch
gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', gulp.series('sass')); //glup4.0寫法
    gulp.watch('./source/*.jade', gulp.series('jade'));
    gulp.watch('./source/js/**/*.js', gulp.series('babel'));
});

// gulp-gh-pages
gulp.task('deploy', function () {
    return gulp.src('./public/**/*')
        .pipe($.ghPages());
});

// build(提交前的專案建立使用)
gulp.task('build',
    gulp.series(
        'clean',
        'bower',
        'vendorJs',
        gulp.parallel('jade', 'sass', 'babel', 'vendorJs')
    )
)

// 開發時使用
gulp.task('default', gulp.series(['jade', 'sass', 'babel', 'bower', 'vendorJs', 'imagemin', gulp.parallel('browser-sync', 'watch')]));
