import * as gulp from "gulp";
import postcss from "gulp-postcss";
import { rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { Transform } from "node:stream";
import handlebars from "handlebars";
import { optimize } from "svgo";
import { launch } from "puppeteer";
import { resolve, dirname, join } from "path";
import config from "./resume.config.js";
import livereload from "./server/livereload.js";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const buildDir = resolve("./build");

const paths = {
  data: {
    src: config.source,
  },
  styles: {
    src: "./src/**/*.css",
    dest: buildDir,
  },
  templates: {
    src: "./src/**/*.html",
    dest: buildDir,
  },
  svg: {
    src: "./src/**/*.svg",
    dest: buildDir,
  },
  fonts: {
    src: "./src/fonts",
    dest: buildDir,
  },
  pdf: {
    dest: config.pdf.dest,
  },
};

const tailwindConfig = {
  content: [paths.templates.src],
  theme: {
    colors: {
      accent: config.colors.accent,
      neutral: config.colors.neutral,
    },
  },
  plugins: [],
};

const postCssPlugins = [tailwindcss(tailwindConfig), autoprefixer, cssnano];

handlebars.registerHelper("join", function (items, separator) {
  return items.join(separator);
});

handlebars.registerHelper("dateformat", function (date) {
  return new Date(date).toLocaleDateString([], {
    year: "2-digit",
    month: "long",
  });
});

export async function clean() {
  await Promise.all([
    rm(buildDir, { recursive: true, force: true }),
    rm(config.pdf.dest, { force: true }),
  ]);

  return Promise.all([
    mkdir(buildDir, { recursive: true }),
    mkdir(dirname(config.pdf.dest), { recursive: true }),
  ]);
}

function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(postcss(postCssPlugins))
    .pipe(gulp.dest(paths.styles.dest));
}

function render(context) {
  return new Transform({
    objectMode: true,
    write(chunk, _, callback) {
      if (chunk.isBuffer()) {
        chunk.contents = Buffer.from(
          handlebars.compile(chunk.contents.toString())(context),
        );
      }

      this.push(chunk);
      callback(null, chunk);
    },
  });
}

function svgo() {
  return new Transform({
    objectMode: true,
    write(chunk, encoding, callback) {
      if (chunk.isBuffer()) {
        const result = optimize(chunk.contents.toString("utf8"), {
          path: chunk.path,
        });
        chunk.contents = Buffer.from(result.data);
      }
      this.push(chunk);
      callback(null, chunk);
    },
  });
}

async function templates() {
  const context = JSON.parse(await readFile(paths.data.src));

  return gulp
    .src(paths.templates.src)
    .pipe(
      render({
        config,
        ...context,
      }),
    )
    .pipe(gulp.dest(paths.templates.dest));
}

function svg() {
  return gulp.src(paths.svg.src).pipe(svgo()).pipe(gulp.dest(paths.svg.dest));
}

async function fonts() {
  const manifest = JSON.parse(
    await readFile(join(paths.fonts.src, "manifest.json")),
  );
  const content = (
    await Promise.all(
      manifest.map(async (font) => {
        const base64 = await readFile(
          join(paths.fonts.src, font.src),
          "base64",
        );

        const properties = [
          `font-family: "${font.family}"`,
          `src: url("data:font/${font.type};base64,${base64}") format("${font.format}")`,
          "font-display: swap",
        ];

        if (font.weight) {
          properties.push(`font-weight: ${font.weight}`);
        }

        if (font.style) {
          properties.push(`font-style: "${font.style}"`);
        }

        return `@font-face {${properties.join(";")}}`;
      }),
    )
  ).join("\n");

  return await writeFile(join(paths.fonts.dest, "fonts.css"), content);
}

export function watch() {
  gulp.parallel(styles, templates, svg, fonts)();

  gulp.watch(paths.data.src, templates);
  gulp.watch(paths.templates.src, templates);
  gulp.watch(paths.templates.src, styles);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.svg.src, svg);
  gulp.watch(paths.fonts.src + "/*", fonts);

  const server = livereload(buildDir);
  server.start();

  gulp.watch(buildDir + "/**/*").on("change", server.reload);
}

export async function pdf() {
  const browser = await launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${resolve(buildDir, "index.html")}`, {
    waitUntil: "networkidle0",
  });
  await page.pdf({
    path: config.pdf.dest,
    ...config.pdf.options,
  });
  await browser.close();
}

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
export const build = gulp.series(
  clean,
  gulp.parallel(styles, templates, svg, fonts),
  pdf,
);

export default build;
