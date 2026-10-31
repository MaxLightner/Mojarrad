/** Keep public theme text at or above 13 CSS pixels.
 * Run with --fix for a mechanical rewrite; CI runs read-only.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const theme = join(dirname(fileURLToPath(import.meta.url)), '..', 'themes', 'mojarrad');
const minimum = 13;
const fix = process.argv.includes('--fix');
const stylesheets = [];

function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(join(dir, entry.name));
    else if (entry.isFile() && entry.name.endsWith('.css')) stylesheets.push(join(dir, entry.name));
  }
}
collect(theme);

let found = 0;
for (const file of stylesheets) {
  let css = readFileSync(file, 'utf8');
  const original = css;
  const replaceSize = (full, before, raw) => {
    if (Number(raw) >= minimum) return full;
    found++;
    if (!fix) console.error(file.slice(theme.length + 1) + ': ' + full.trim());
    return fix ? before + minimum + 'px' : full;
  };
  css = css.replace(/(\bfont-size\s*:\s*)(\d+(?:\.\d+)?)px\b/gi, replaceSize);
  // Also catches declarations like font:600 10px/1.5 Vazirmatn.
  css = css.replace(/(\bfont\s*:\s*(?:[^;{}]*?\s)?)(\d+(?:\.\d+)?)px(?=[/\s;}])/gi, replaceSize);
  if (fix && css !== original) writeFileSync(file, css);
}
if (found) {
  console.log((fix ? 'Raised' : 'Found') + ' ' + found + ' font declarations below ' + minimum + 'px.');
  if (!fix) process.exitCode = 1;
} else console.log('Theme typography check passed: no explicit font below 13px.');
