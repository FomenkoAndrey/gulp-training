const {task, series, parallel, src, dest, watch} = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync');
const notify = require('gulp-notify');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');

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
    browsers: [
      'last 5 versions',
      '> 0.1%'
    ],
    cascade: true
  }),
  mqpacker({sort: true})
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

function cssMin() {
  const pluginsExtended = plugins.concat([cssnano({preset: 'default'})]);

  return src(path.cssFile).
    pipe(postcss(pluginsExtended)).
    pipe(rename({suffix: '.min'})).
    pipe(dest(path.cssFolder)).
    pipe(browserSync.reload({stream: true}));
}

function scssMin() {
  const pluginsExtended = plugins.concat([cssnano({preset: 'default'})]);

  return src(path.scssFile).
    pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)).
    pipe(postcss(pluginsExtended)).
    pipe(rename({suffix: '.min'})).
    pipe(dest(path.cssFolder)).
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
  watch(path.scssFiles, scss);
  watch(path.htmlFiles, sync);
  watch(path.jsFiles, sync);
}

task('comb', comb);
task('scss', series(scss, cssMin));
task('min', scssMin);
task('dev', scssDev);
task('watch', watchFiles);
