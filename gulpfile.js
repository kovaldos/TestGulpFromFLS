let projectDir = "dist";
let sourceDir = "#src";

let fs = require("fs");

let path = {
  build: {
    html: projectDir + "/",
    css: projectDir + "/css/",
    js: projectDir + "/js/",
    img: projectDir + "/img/",
    fonts: projectDir + "/fonts/"
  },
  src: {
    html: [
      sourceDir + "/*.{html,pug}",
      "!" + sourceDir + "/_*.{html,pug}",
    ] /*ToDo Настроить для pug*/,
    css: sourceDir + "/styles/style.sass",
    js: sourceDir + "/js/script.js",
    img: sourceDir + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: sourceDir + "/fonts/*.{ttf,otf}"
  },
  watch: {
    html: sourceDir + "/**/*.{html,pug}",
    css: sourceDir + "/styles/**/*.sass",
    js: sourceDir + "/js/**/*.js",
    img: sourceDir + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
  },
  clean: "./" + projectDir + "/",
};

let { src, dest, parallel } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  sass = require("gulp-sass")(require("sass")),
  autoprefixer = require("gulp-autoprefixer"),
  group_media = require("gulp-group-css-media-queries"),
  clean_css = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  uglify = require("gulp-uglify-es").default,
  imagemin = require("gulp-imagemin"),
  webp = require("gulp-webp"),
  webphtml = require("gulp-webp-html"),
  webpcss = require("gulp-webpcss"),
  svgSprite = require("gulp-svg-sprite"),
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  fonter = require("gulp-fonter");

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + projectDir + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      sass({
        outputStyle: "expanded",
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(
      webpcss({
        webpClass: ".webp",
        noWebpClass: ".no-webp",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 85,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 5, // от 0 до 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts(params) {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

gulp.task("otf2ttf", function () {
  return gulp
    .src([sourceDir + "/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(sourceDir + "/fonts/"));
});

gulp.task("svgSprite", function () {
  return gulp
    .src([sourceDir + "/svg/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../icons/icons.svg", //sprite file name
            // example: true
          },
        },
      })
    )
    .pipe(dest(path.build.img));
});

function fontsStyle(params) {
  let file_content = fs.readFileSync(sourceDir + "/styles/_fonts.sass");
  if (file_content == "") {
    fs.writeFile(sourceDir + "/styles/_fonts.sass", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              sourceDir + "/styles/_fonts.sass",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean(params) {
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
