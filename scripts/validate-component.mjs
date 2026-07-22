#!/usr/bin/env node
/**
 * Checks the small, reviewable delivery contract for one framework component.
 * Usage: npm run validate:component -- dv-example
 */
import { existsSync, readFileSync } from 'node:fs';

const tag = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!tag || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(tag)) {
  console.error('Usage: npm run validate:component -- prefix-example');
  process.exit(1);
}

const source = [`src/components/${tag}.dv.js`, `src/components/${tag}.js`].find(existsSync);
const required = [
  source,
  `tests/unit/${tag}.test.js`,
  `docs/components/${tag}.md`,
].filter(Boolean);
const missing = required.filter((file) => !existsSync(file));

if (!source) missing.unshift(`src/components/${tag}.dv.js or src/components/${tag}.js`);
if (missing.length) {
  console.error(`[devinim] ${tag}: missing ${missing.join(', ')}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync('docs/component-manifest.json', 'utf8'));
const entry = manifest.components?.find((item) => item.tag === tag);
if (!entry) {
  console.error(`[devinim] ${tag}: add a matching entry to docs/component-manifest.json.`);
  process.exit(1);
}

const sourceText = readFileSync(source, 'utf8');
if (source.endsWith('.dv.js') && !sourceText.includes(`component('${tag}'`)) {
  console.error(`[devinim] ${tag}: .dv.js source must register component('${tag}', ...).`);
  process.exit(1);
}

console.log(`[devinim] ${tag}: component contract is complete.`);
