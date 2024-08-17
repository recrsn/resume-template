const gulp = require('gulp');
const postcss = require('gulp-postcss');
const fs = require('node:fs/promises')
const {Transform} = require('node:stream');
const Handlebars = require('handlebars');
const {optimize} = require('svgo');
const puppeteer = require('puppeteer');
const path = require('path');
const config = require('./resume.config')


const buildDir = path.resolve(__dirname, 'build');

const paths = {
    data: {
        src: config.source
    },
    styles: {
        src: './src/**/*.css',
        dest: buildDir
    },
    templates: {
        src: './src/**/*.html',
        dest: buildDir
    },
    svg: {
        src: 'src/**/*.svg',
        dest: buildDir
    },
    pdf: {
        dest: config.pdf.dest
    }
};

const tailwindConfig = {
    content: [
        paths.templates.src,
    ],
    theme: {
        colors: {
            accent: config.colors.accent,
            neutral: config.colors.neutral,
        }
    },
    plugins: [],
};

const postCssPlugins = [
    require('tailwindcss')(tailwindConfig),
    require('autoprefixer'),
    require('cssnano')
];

Handlebars.registerHelper('join', function (items, separator) {
    return items.join(separator);
});

Handlebars.registerHelper('dateformat', function (date) {
    return new Date(date).toLocaleDateString([], {
        year: '2-digit',
        month: 'long',
    });
})

async function clean() {
    await Promise.all([
        fs.rm(buildDir, {recursive: true, force: true}),
        fs.rm(config.pdf.dest, {force: true})
    ])

    return Promise.all([
        fs.mkdir(buildDir, {recursive: true}),
        fs.mkdir(path.dirname(config.pdf.dest), {recursive: true})
    ]);
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(postcss(postCssPlugins))
        .pipe(gulp.dest(paths.styles.dest));
}

function render(context) {
    return new Transform({
        objectMode: true,
        write(chunk, _, callback) {
            if (chunk.isBuffer()) {
                chunk.contents = Buffer.from(Handlebars.compile(chunk.contents.toString())(context));
            }

            this.push(chunk);
            callback(null, chunk);
        }
    });
}

function svgo() {
    return new Transform({
        objectMode: true,
        write(chunk, encoding, callback) {
            if (chunk.isBuffer()) {
                const result = optimize(chunk.contents.toString('utf8'), {path: chunk.path})
                chunk.contents = Buffer.from(result.data);
            }
            this.push(chunk);
            callback(null, chunk);
        }
    });
}

function templates() {
    const context = require(paths.data.src);

    return gulp.src(paths.templates.src)
        .pipe(render(context))
        .pipe(gulp.dest(paths.templates.dest));
}

function svg() {
    return gulp.src(paths.svg.src)
        .pipe(svgo())
        .pipe(gulp.dest(paths.svg.dest));
}


function watch() {
    gulp.watch(paths.data.src, templates);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.templates.src, styles);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.svg.src, svg);
}

async function pdf() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(buildDir, 'index.html')}`, {
        waitUntil: 'networkidle0',
    });
    await page.pdf({
        path: config.pdf.dest,
        ...config.pdf.options
    });
    await browser.close();
}

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
const build = gulp.series(clean, gulp.parallel(styles, templates, svg), pdf);

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean;
exports.watch = watch;
exports.build = build;

exports.default = build;