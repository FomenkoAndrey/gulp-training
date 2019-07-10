const {task, series, parallel, src, dest, watch} = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync');
const notify = require('gulp-notify');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');

const path = {
  scssFolder: './assets/scss/',
  scssFiles: './assets/scss/**/*.scss',
  scssFile: './assets/scss/style.scss',
  cssFolder: './assets/css/',
  cssFile: './assets/css/style.css',
  htmlFiles: './*.html',
  jsFiles: './assets/js/**/*.js'
};

const plugins = [
  autoprefixer({
    overrideBrowserslist: [
      'last 5 versions',
      '> 1%'
    ],
    cascade: true
  }),
  mqpacker({sort: sortCSSmq})
];

function scss() {
  return src(path.scssFile).
    pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)).
    pipe(postcss(plugins)).
    pipe(dest(path.cssFolder)).
    pipe(notify({
      message: 'Compiled!',
      sound: false
    })).
    pipe(browserSync.reload({stream: true}));
}

function scssDev() {
  return src(path.scssFile, {sourcemaps: true}).
    pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)).
    pipe(postcss(plugins)).
    pipe(dest(path.cssFolder, {sourcemaps: true})).
    pipe(notify({
      message: 'Compiled!',
      sound: false
    })).
    pipe(browserSync.reload({stream: true}));
}

function comb() {
  return src(path.scssFiles).
    pipe(csscomb()).
    on('error', notify.onError((error) => `File: ${error.message}`)).
    pipe(dest(path.scssFolder));
}

function syncInit() {
  browserSync({
    server: {baseDir: './'},
    notify: false
  });
}

async function sync() {
  browserSync.reload();
}

function watchFiles() {
  syncInit();
  watch(path.scssFiles, series(scss));
  watch(path.htmlFiles, sync);
  watch(path.jsFiles, sync);
}

task('comb', series(comb));
task('scss', series(scss));
task('dev', series(scssDev));
task('watch', watchFiles);
