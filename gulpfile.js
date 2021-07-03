const {task, series, parallel, src, dest, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');

const PATH = {
  scssFolder: './assets/scss/',
  scssFiles: './assets/scss/**/*.scss',
  scssFile: './assets/scss/style.scss',
  cssFolder: './assets/css/',
  cssFiles: './assets/css/*.css',
  cssFile: './assets/css/style.css',
  htmlFiles: './*.html',
  jsFiles: './assets/js/**/*.js'
};

const PLUGINS = [
  autoprefixer({
    overrideBrowserslist: [
      'last 5 versions',
      '> 0.1%'
    ],
    cascade: true
  }),
  mqpacker({sort: sortCSSmq})
];

function scss() {
  return src(PATH.scssFile).
    pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)).
    pipe(postcss(PLUGINS)).
    pipe(dest(PATH.cssFolder)).
    pipe(browserSync.stream());
}

function scssDev() {
  return src(PATH.scssFile, {sourcemaps: true}).
    pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)).
    pipe(postcss(PLUGINS)).
    pipe(dest(PATH.cssFolder, {sourcemaps: true})).
    pipe(browserSync.stream());
}

function comb() {
  return src(PATH.scssFiles).
    pipe(csscomb()).
    pipe(dest(PATH.scssFolder));
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
  watch(PATH.scssFiles, series(scss));
  watch(PATH.htmlFiles, sync);
  watch(PATH.jsFiles, sync);
  // watch(PATH.cssFiles, sync);
}

task('comb', series(comb));
task('scss', series(scss));
task('dev', series(scssDev));
task('watch', watchFiles);
