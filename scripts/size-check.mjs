#!/usr/bin/env node
/**
 * Size gate (ADR-0008 #5, constitution §9.3): bundles src/core/core.js with esbuild
 * (minify + tree-shake), gzips the result and fails when it exceeds the core budget.
 *
 * Usage: npm run size
 */
import { gzipSync } from 'node:zlib';
import { buildSync } from 'esbuild';

const BUDGET_BYTES = 4 * 1024; // 4 KB min+gzip for the whole core

const result = buildSync({
  entryPoints: ['src/core/core.js'],
  bundle: true,
  minify: true,
  write: false,
  format: 'esm',
  logLevel: 'silent',
});

const minified = result.outputFiles[0].contents;
const gzipped = gzipSync(minified, { level: 9 });

console.log(`core bundle: ${minified.length} B min, ${gzipped.length} B min+gzip (budget ${BUDGET_BYTES} B)`);

if (gzipped.length > BUDGET_BYTES) {
  console.error(`SIZE GATE FAILED: core exceeds the 4 KB min+gzip budget (ADR-0010).`);
  process.exit(1);
}
console.log('SIZE GATE PASSED');
