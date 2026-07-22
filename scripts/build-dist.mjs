#!/usr/bin/env node
/**
 * Builds the committed consumer artifacts in dist/ (ADR-0007 #3):
 * - dist/core.js            readable single-file ESM bundle of the core
 * - dist/core.min.js        minified core bundle (the canonical CDN entry)
 * - dist/modules/*.js       per-component, minified, importing ../core.min.js
 * - dist/devinim.min.js     all-in-one (core + all framework components, self-registering)
 *
 * Consumers never run this — it is a maintainer pre-release step. Usage: npm run build
 */
import { buildSync, transformSync } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const COMPONENTS = ['dv-counter', 'dv-tabs', 'dv-disclosure', 'dv-modal', 'dv-toast', 'dv-pagination', 'dv-dropdown', 'dv-search', 'dv-product-card', 'dv-field', 'dv-confirm', 'dv-autocomplete', 'dv-data-table'];
const shared = { bundle: true, format: 'esm', logLevel: 'silent' };

mkdirSync('dist/modules', { recursive: true });

buildSync({ ...shared, entryPoints: ['src/core/core.js'], outfile: 'dist/core.js', minify: false });
buildSync({ ...shared, entryPoints: ['src/core/core.js'], outfile: 'dist/core.min.js', minify: true });
buildSync({ ...shared, entryPoints: ['src/core/app.js'], outfile: 'dist/app.min.js', minify: true });
buildSync({ ...shared, entryPoints: ['src/devinim.js'], outfile: 'dist/devinim.min.js', minify: true });

for (const name of COMPONENTS) {
  // Modules stay per-file and share ../core.min.js via the browser module cache — importing
  // several modules never duplicates the core (ADR-0007).
  const rewritten = readFileSync(`src/components/${name}.js`, 'utf8').replace(
    `from '../core/core.js'`,
    `from '../core.min.js'`,
  );
  const { code } = transformSync(rewritten, { minify: true, loader: 'js' });
  writeFileSync(`dist/modules/${name}.js`, code);
}

const report = (label, code) => {
  const bytes = Buffer.byteLength(code);
  console.log(`${label}: ${bytes} B (${gzipSync(code, { level: 9 }).length} B gzip)`);
};
for (const file of ['dist/core.min.js', 'dist/app.min.js', 'dist/devinim.min.js', ...COMPONENTS.map((c) => `dist/modules/${c}.js`)]) {
  report(file, readFileSync(file, 'utf8'));
}
console.log('dist/ built.');
