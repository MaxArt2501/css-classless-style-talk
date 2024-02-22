import { sync } from 'glob';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { sync as rimraf } from 'rimraf';
import { compile } from 'sass';

/** @param {string[]} paths */
const getCommonPath = paths => {
  const dirs = new Set(paths.map(path => dirname(path)));
  const splitDirs = Array.from(dirs, dir => dir.split(sep));
  return splitDirs
    .reduce((segments, splitPath) => {
      const differentIndex = segments.findIndex((segment, index) => segment !== splitPath[index]);
      return differentIndex >= 0 ? segments.slice(0, differentIndex) : segments;
    })
    .join(sep);
};

const safeWrite = (path, content) => {
  const directory = dirname(path);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  writeFileSync(path, content);
};

const safeCopy = (source, dest) => {
  const directory = dirname(dest);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  copyFileSync(source, dest);
};

export const buildSlides = () => {
  const files = sync('src/presentations/**/*.html');
  const commonPath = getCommonPath(files);
  for (const filename of files) {
    const html = readFileSync(filename, 'utf-8');
    const parsed = html.replace(/\bslide:(.+?)\s/g, (m, source) => {
      try {
        const slide = readFileSync(`src/slides/${source}.html`, 'utf-8');
        return `<!--slide:${source}-->${slide.trim()}<!--/slide:${source}-->\n`;
      } catch (e) {
        console.error(`Slide not found: ${source}`);
        return m;
      }
    });
    safeWrite(join('public', relative(commonPath, filename)), parsed);
  }
};

export const buildStyle = (sources = sync('src/styles/*.scss')) => {
  return sources.map(source => {
    const result = compile(source, { style: 'compressed' });
    const destination = join('public', 'css', `${basename(source, '.scss')}.css`);
    safeWrite(destination, result.css);
    return destination;
  });
};

export const buildJavaScript = (files = sync('src/js/**/*.js')) => {
  const commonPath = join('src', 'js');
  for (const filename of files) {
    safeCopy(filename, join('public', 'js', relative(commonPath, filename)));
  }
};

export const copyAssets = (files = sync('static/**/*', { nodir: true })) =>
  files.map(filename => {
    const destination = join('public', relative('static', filename));
    safeCopy(filename, destination);
    return destination;
  });

export const copyVendors = () => {
  for (const filename of sync(
    [
      'node_modules/p-slides/components/**/*.js',
      'node_modules/p-slides/*.js',
      'node_modules/p-slides/css/**/*.css',
      'node_modules/prismjs/prism.js',
      'node_modules/prismjs/components/prism-typescript.js',
      'node_modules/prismjs/components/prism-scss.js',
      'node_modules/prismjs/themes/prism.css'
    ],
    { nodir: true }
  )) {
    safeCopy(filename, join('public', 'vendor', relative('node_modules', filename)));
  }
};

export const clean = async () => rimraf('public');

// const modulePath = fileURLToPath(import.meta.url);
// const scriptPath = process.argv[1];

// if (modulePath === scriptPath) {
clean();
buildSlides();
buildStyle();
buildJavaScript();
copyAssets();
copyVendors();
// }
