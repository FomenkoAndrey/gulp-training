import { series, src, dest, watch } from 'gulp'
import gulpSass from 'gulp-sass'
import * as sass from 'sass'
import replace from 'gulp-replace'
import dc from 'postcss-discard-comments'
import browserSync from 'browser-sync'
import postcss from 'gulp-postcss'
import csscomb from 'gulp-csscomb'
import cssnano from 'cssnano'
import rename from 'gulp-rename'
import autoprefixer from 'autoprefixer'
import sortMediaQueries from 'postcss-sort-media-queries'
import pug from 'gulp-pug'
import fs from 'fs'

// Динамічний імпорт для sort-css-media-queries
const { default: sortCSSmq } = await import('sort-css-media-queries')

// Налаштування Sass компілятора
const sassCompiler = gulpSass(sass)

const option = process.argv[3]

const PATH = {
  scssFolder: './src/scss/',
  scssAllFiles: ['./src/scss/**/*.scss', '!**/_mixins-media.scss', '!**/_variables.scss', '!**/_skins.scss'],
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
  imagesFolder: './assets/images/',
  vendorsFolder: './assets/vendors/'
}

const SEARCH_IMAGE_REGEXP = /url\(['"]?.*\/images\/(.*?)\.(png|jpe?g|gif|webp|svg)['"]?\)/g
const REPLACEMENT_IMAGE_PATH = 'url(../images/$1.$2)'

const PLUGINS = [
  dc({ discardComments: true }),
  autoprefixer({
    overrideBrowserslist: ['last 5 versions', '> 0.1%']
  }),
  sortMediaQueries({
    sort: sortCSSmq
  })
]

function compileScss() {
  return src(PATH.scssRootFile)
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(postcss(PLUGINS))
    .pipe(replace(SEARCH_IMAGE_REGEXP, REPLACEMENT_IMAGE_PATH))
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSync.stream())
}

function compileScssMin() {
  const pluginsForMinify = [...PLUGINS, cssnano({ preset: 'default' })]

  return src(PATH.scssRootFile)
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(replace(SEARCH_IMAGE_REGEXP, REPLACEMENT_IMAGE_PATH))
    .pipe(postcss(pluginsForMinify))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(PATH.cssFolder))
}

function compileScssDev() {
  const pluginsForDevMode = [...PLUGINS]

  pluginsForDevMode.splice(1, 1)

  return src(PATH.scssRootFile, { sourcemaps: true })
    .pipe(sassCompiler().on('error', sassCompiler.logError))
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
  // Структура SCSS файлів по папках за патерном 7-1
  const scssFiles = {
    abstracts: [
      '_index',
      '_variables', // змінні проекту
      '_skin', // кольори, тіні, градієнти
      '_mixins', // міксини
      '_mixins-media', // міксини для медіа-запитів
      '_extends' // плейсхолдери
    ],
    base: [
      '_index',
      '_common', // базові стилі
      '_typography' // типографіка
    ],
    layout: ['_index', '_header', '_footer', '_main'],
    components: [
      '_index'
      // тут будуть компоненти
    ],
    root: [
      'style' // головний файл
    ]
  }

  // Створюємо масив шляхів для всіх SCSS файлів
  const scssAllFiles = Object.entries(scssFiles).flatMap(([folder, files]) => {
    return files.map((fileName) =>
      folder === 'root' ? `${PATH.scssFolder}${fileName}.scss` : `${PATH.scssFolder}${folder}/${fileName}.scss`
    )
  })

  const filePaths = [
    `${PATH.htmlFolder}index.html`,
    `${PATH.pugFolder}index.pug`,
    `${PATH.cssFolder}style.css`,
    `${PATH.jsFolder}main.js`,
    scssAllFiles
  ]

  // Створюємо папки для SCSS
  const scssFolders = ['abstracts', 'base', 'layout', 'components']
  scssFolders.forEach((folder) => {
    fs.mkdirSync(`${PATH.scssFolder}${folder}`, { recursive: true })
  })

  // Створюємо основні папки проекту
  src('*.*', { read: false })
    .pipe(dest(PATH.scssFolder))
    .pipe(dest(PATH.pugFolder))
    .pipe(dest(PATH.cssFolder))
    .pipe(dest(PATH.jsFolder))
    .pipe(dest(PATH.imagesFolder))
    .pipe(dest(PATH.vendorsFolder))

  return new Promise((resolve) =>
    setTimeout(() => {
      filePaths.forEach((filePath) => {
        if (Array.isArray(filePath)) {
          filePath.forEach((subPath) => {
            // Створюємо папку, якщо її немає
            const dir = subPath.substring(0, subPath.lastIndexOf('/'))
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(subPath, '')
            console.log(subPath)
          })
        } else {
          const dir = filePath.substring(0, filePath.lastIndexOf('/'))
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          fs.writeFileSync(filePath, '')
          console.log(filePath)
        }
      })
      resolve(true)
    }, 1000)
  )
}

// Експорт функцій для використання як задач
export { compileScss, compileScssMin, compileScssDev, compilePug, comb, serverInit, sync, watchFiles, createStructure }

// Композитні задачі
export const scss = series(comb, compileScss, compileScssMin)
export const min = compileScssMin
export const dev = compileScssDev
export const combTask = series(comb, compileScss, compileScssMin)
export const pugTask = compilePug
export const cs = createStructure
export const startWatch = watchFiles

// Дефолтна задача
export default watchFiles
