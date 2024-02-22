import bSync from 'browser-sync';
import { relative } from 'node:path';
import { buildJavaScript, buildSlides, buildStyle, copyAssets } from './build.js';

const server = bSync.create();

const baseDir = './public';
const cssDir = `${baseDir}/css`;

server.init({
  ghostMode: false,
  server: { baseDir }
});

server.watch('src/**/*.html', {}, (event, file) => {
  console.log(`src/**/*.html -> ${event}: ${file}`);
  buildSlides();
  server.reload();
});

server.watch('src/js/**/*.js', {}, (event, file) => {
  console.log(`src/js/**/*.js -> ${event}: ${file}`);
  if (!['add', 'change'].includes(event)) return;
  buildJavaScript([file]);
  server.reload();
});

server.watch('src/styles/**/*.scss', {}, (event, file) => {
  console.log(`src/styles/**/*.scss -> ${event}: ${file}`);
  const modified = buildStyle();
  server.reload(modified.map(path => relative(cssDir, path)));
});

server.watch('static/**/*', {}, (event, file) => {
  console.log(`static/**/* -> ${event}: ${file}`);
  if (!['add', 'change'].includes(event)) return;
  const modified = copyAssets([file]);
  server.reload(modified.map(path => relative(baseDir, path)));
});
