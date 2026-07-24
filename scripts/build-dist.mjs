#!/usr/bin/env node
/**
 * Builds the committed consumer artifacts in dist/ (ADR-0007 #3):
 * - dist/core.js            readable single-file ESM bundle of the core
 * - dist/core.min.js        minified core bundle (the canonical CDN entry)
 * - dist/authoring.min.js   AI-first component authoring entry
 * - dist/modules/*.js       per-component, minified, importing ../core.min.js
 * - dist/devinim.min.js     all-in-one (core + all framework components, self-registering)
 *
 * Consumers never run this — it is a maintainer pre-release step. Usage: npm run build
 */
import { buildSync } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const COMPONENTS = ['dv-counter', 'dv-tabs', 'dv-disclosure', 'dv-modal', 'dv-toast', 'dv-pagination', 'dv-dropdown', 'dv-search', 'dv-product-card', 'dv-field', 'dv-confirm', 'dv-autocomplete', 'dv-data-table', 'dv-cart', 'dv-toast-stack', 'dv-state'];
const shared = { bundle: true, format: 'esm', logLevel: 'silent' };

mkdirSync('dist/modules', { recursive: true });
copyFileSync('themes/ckcss.css', 'dist/devinim-ckcss.css');

buildSync({ ...shared, entryPoints: ['src/core/core.js'], outfile: 'dist/core.js', minify: false });
buildSync({ ...shared, entryPoints: ['src/core/core.js'], outfile: 'dist/core.min.js', minify: true });
buildSync({ ...shared, entryPoints: ['src/core/authoring.js'], outfile: 'dist/authoring.min.js', minify: true });
copyFileSync('dist/authoring.min.js', 'site/assets/authoring.min.js');
buildSync({ ...shared, entryPoints: ['src/core/app.js'], outfile: 'dist/app.min.js', minify: true });
buildSync({ ...shared, entryPoints: ['src/devinim.js'], outfile: 'dist/devinim.min.js', minify: true });

for (const name of COMPONENTS) {
  // Modules stay per-file and share ../core.min.js via the browser module cache — importing
  // several modules never duplicates the core (ADR-0007). i18n/transition helpers and each
  // component's own locale bundle are inlined (bundle: true, resolved relative to
  // src/components/) so a copied dist/modules/<name>.js is genuinely self-contained — it used to
  // leave `../core/i18n.js`/`../core/transition.js`/`./<name>.locale.js` as unresolved relative
  // imports that 404 once the file is copied outside this repo's own dist/ tree (found while
  // building the admin-dashboard starter kit, TASK-020). `./dv-pagination.js` (dv-data-table's
  // one cross-component import) stays external/unbundled on purpose: it's a real sibling file in
  // dist/modules/, and inlining it would make two independently-loaded modules each call
  // `define('dv-pagination', …)`, which throws on the second registration.
  const rewritten = readFileSync(`src/components/${name}.js`, 'utf8')
    .replace(`from '../core/core.js'`, `from '../core.min.js'`)
    .replace(`from '../core/authoring.js'`, `from '../authoring.min.js'`);
  const result = buildSync({
    stdin: { contents: rewritten, resolveDir: 'src/components', sourcefile: `${name}.js`, loader: 'js' },
    bundle: true,
    format: 'esm',
    minify: true,
    external: ['../core.min.js', '../authoring.min.js', './dv-pagination.js'],
    write: false,
    logLevel: 'silent',
  });
  writeFileSync(`dist/modules/${name}.js`, result.outputFiles[0].contents);
}

const report = (label, code) => {
  const bytes = Buffer.byteLength(code);
  console.log(`${label}: ${bytes} B (${gzipSync(code, { level: 9 }).length} B gzip)`);
};
for (const file of ['dist/core.min.js', 'dist/authoring.min.js', 'dist/app.min.js', 'dist/devinim.min.js', ...COMPONENTS.map((c) => `dist/modules/${c}.js`)]) {
  report(file, readFileSync(file, 'utf8'));
}
console.log('dist/ built.');
