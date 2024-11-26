const originalWrite = process.stderr.write // Перехоплюємо потоки stdout та stderr

process.stderr.write = function (chunk, ...args) {
  const ignoreMessages = [
    'The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0',
    '[DEP0180] DeprecationWarning: fs.Stats constructor is deprecated'
  ]

  // Ігноруємо повідомлення, які містять зазначені фрази
  if (ignoreMessages.some((msg) => chunk.toString().includes(msg))) {
    return // Нічого не робимо
  }

  return originalWrite.call(process.stderr, chunk, ...args) // Викликаємо стандартний метод для інших повідомлень
}

const { task, series, parallel, src, dest, watch } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const replace = require('gulp-replace')
const dc = require('postcss-discard-comments')
const browserSync = require('browser-sync')
const postcss = require('gulp-postcss')
const csscomb = require('gulp-csscomb')
const cssnano = require('cssnano')
const rename = require('gulp-rename')
const autoprefixer = require('autoprefixer')
const mqpacker = require('css-mqpacker')
const sortCSSmq = require('sort-css-media-queries')
const pug = require('gulp-pug')

const option = process.argv[3]

const PATH = {
  scssFolder: './src/scss/',
  scssAllFiles: ['./src/scss/**/*.scss', '!**/_mixins-media.scss'], // Виключаємо _mixins-media.scss
  scssRootFile: './src/scss/style.scss',
  pugFolder: './src/templates/',
  pugAllFiles: './src/templates/**/*.pug',
  pugRootFile: './src/templates/index.pug',
  cssFolder: './assets/css/',
  cssAllFiles: './assets/css/*.css',
  cssRootFile: './assets/css/style.css',
  htmlFolder: './',
  htmlAllFiles: './*.html',
  jsFolder: './assets/js/',
  jsAllFiles: './assets/js/**/*.js',
  imgFolder: './assets/images/'
}

const SEARCH_IMAGE_REGEXP = /url\(['"]?.*\/images\/(.*?)\.(png|jpg|gif|webp|svg)['"]?\)/g
const REPLACEMENT_IMAGE_PATH = 'url(../images/$1.$2)'

const PLUGINS = [
  dc({ discardComments: true }),
  autoprefixer({
    overrideBrowserslist: ['last 5 versions', '> 0.1%']
  }),
  mqpacker({ sort: sortCSSmq })
]

function compileScss() {
  return src(PATH.scssRootFile)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(PLUGINS))
    .pipe(replace(SEARCH_IMAGE_REGEXP, REPLACEMENT_IMAGE_PATH))
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSync.stream())
}

function compileScssMin() {
  const pluginsForMinify = [...PLUGINS, cssnano({ preset: 'default' })]

  return src(PATH.scssRootFile)
    .pipe(sass().on('error', sass.logError))
    .pipe(replace(SEARCH_IMAGE_REGEXP, REPLACEMENT_IMAGE_PATH))
    .pipe(postcss(pluginsForMinify))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(PATH.cssFolder))
}

function compileScssDev() {
  const pluginsForDevMode = [...PLUGINS]

  pluginsForDevMode.splice(1, 1)

  return src(PATH.scssRootFile, { sourcemaps: true })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(pluginsForDevMode))
    .pipe(replace(SEARCH_IMAGE_REGEXP, REPLACEMENT_IMAGE_PATH))
    .pipe(dest(PATH.cssFolder, { sourcemaps: true }))
    .pipe(browserSync.stream())
}

function compilePug() {
  return src(PATH.pugRootFile)
    .pipe(pug({ pretty: true }))
    .pipe(dest(PATH.htmlFolder))
}

function comb() {
  return src(PATH.scssAllFiles).pipe(csscomb()).pipe(dest(PATH.scssFolder))
}

function serverInit() {
  browserSync({
    server: { baseDir: './' },
    notify: false
  })
}

async function sync() {
  browserSync.reload()
}

function watchFiles() {
  serverInit()
  if (!option) watch(PATH.scssAllFiles, series(compileScss, compileScssMin))
  if (option === '--dev') watch(PATH.scssAllFiles, series(compileScssDev))
  if (option === '--css') watch(PATH.cssAllFiles, sync)
  watch(PATH.htmlAllFiles, sync)
  watch(PATH.pugAllFiles, series(compilePug, sync))
  watch(PATH.jsAllFiles, sync)
}

function createStructure() {
  const scssFileNames = ['style', '_variables', '_skin', '_common', '_footer', '_header']

  const scssAllFiles = scssFileNames.map((fileName) => `${PATH.scssFolder}${fileName}.scss`)

  const filePaths = [
    `${PATH.htmlFolder}index.html`,
    `${PATH.pugFolder}index.pug`,
    `${PATH.cssFolder}style.css`,
    `${PATH.jsFolder}main.js`,
    scssAllFiles
  ]

  src('*.*', { read: false })
    .pipe(dest(PATH.scssFolder))
    .pipe(dest(PATH.pugFolder))
    .pipe(dest(PATH.cssFolder))
    .pipe(dest(PATH.jsFolder))
    .pipe(dest(PATH.imgFolder))

  return new Promise((resolve) =>
    setTimeout(() => {
      filePaths.forEach((filePath) => {
        if (Array.isArray(filePath)) {
          filePath.forEach((subPath) => {
            require('fs').writeFileSync(subPath, '')
            console.log(subPath)
          })
        } else {
          require('fs').writeFileSync(filePath, '')
          console.log(filePath)
        }
      })
      resolve(true)
    }, 1000)
  )
}

task('comb', series(comb, compileScss, compileScssMin))
task('scss', series(comb, compileScss, compileScssMin))
task('dev', series(compileScssDev))
task('min', series(compileScssMin))
task('pug', series(compilePug))
task('cs', series(createStructure))
task('watch', watchFiles)
