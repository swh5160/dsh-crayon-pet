// Builds client.js from client.template.js + the SVG frames in ../art/character.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, STATES } from './art/character.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const frame = (state) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">${render(state)}</svg>`;

const FRAMES = {};
for (const state of STATES) FRAMES[state] = frame(state);
FRAMES['idle-blink'] = frame('idle-blink');

const template = readFileSync(join(here, 'client.template.js'), 'utf8');
const out = template
  .replace('__FRAMES__', JSON.stringify(FRAMES))
  .replace('__ORDER__', JSON.stringify(STATES));

if (out.includes('__FRAMES__') || out.includes('__ORDER__')) {
  throw new Error('placeholder not replaced');
}

writeFileSync(join(here, 'client.js'), out, 'utf8');
console.log(`client.js written (${(out.length / 1024).toFixed(1)} KiB, ${Object.keys(FRAMES).length} frames)`);
