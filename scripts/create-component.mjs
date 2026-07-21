#!/usr/bin/env node
/**
 * Creates the standard component, unit-test and API-documentation files from repository templates.
 * Usage: npm run create:component -- dv-example [--dry-run] [--force]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const tag = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (!tag || !/^dv-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) {
  console.error('Usage: npm run create:component -- dv-example [--dry-run] [--force]');
  process.exit(1);
}

const className = tag.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
const replacements = { __TAG__: tag, __CLASS__: className, __DESCRIPTION__: 'Describe this component' };
const targets = [
  ['templates/component.js.tpl', `src/components/${tag}.js`],
  ['templates/component.test.js.tpl', `tests/unit/${tag}.test.js`],
  ['templates/component.md.tpl', `docs/components/${tag}.md`],
];

for (const [template, target] of targets) {
  const destination = resolve(target);
  if (existsSync(destination) && !force) {
    console.error(`Refusing to overwrite ${target}; use --force only when intentional.`);
    process.exit(1);
  }
  if (dryRun) {
    console.log(`create ${target}`);
    continue;
  }
  const content = replaceTokens(readFileSync(resolve(template), 'utf8'), replacements);
  mkdirSync(resolve(target, '..'), { recursive: true });
  writeFileSync(destination, content);
  console.log(`created ${target}`);
}

if (!dryRun) {
  console.log(`Next: register ${tag} in docs/component-manifest.json, component-library.md and CHANGELOG.md.`);
}

/**
 * @param {string} template - Template source.
 * @param {Record<string, string>} tokens - Token map.
 * @returns {string} Filled template.
 */
function replaceTokens(template, tokens) {
  return Object.entries(tokens).reduce((output, [token, value]) => output.replaceAll(token, value), template);
}
