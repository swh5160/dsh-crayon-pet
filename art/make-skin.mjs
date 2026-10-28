// Renders a palette variant of the crayon kid into a pet skin folder.
//   node make-skin.mjs <id> <outDir> <displayName>
// e.g. node make-skin.mjs blue-kid ../crayon-pet/pets "蓝衫男孩"
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PALETTE, STATES, render } from './character.mjs';

const [id = 'blue-kid', outDir = '', displayName = id] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: node make-skin.mjs <id> <outDir> [displayName]');
  process.exit(1);
}

const target = join(resolve(outDir), id);
mkdirSync(target, { recursive: true });

const original = { ...PALETTE };
Object.assign(PALETTE, {
  shirt: '#3f6fb5',
  shirtShade: '#345d99',
  shorts: '#e8a33d',
  shortsShade: '#c9862c',
  shoeTrim: '#3f6fb5',
  hair: '#4a382c',
});

const frames = {};
for (const state of STATES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="240" height="264" preserveAspectRatio="xMidYMax meet">${render(state)}</svg>`;
  writeFileSync(join(target, `${state}.svg`), svg, 'utf8');
  frames[state] = `${state}.svg`;
}
Object.assign(PALETTE, original);

writeFileSync(join(target, 'pet.json'), JSON.stringify({
  name: displayName,
  scale: 1,
  frames,
}, null, 2) + '\n', 'utf8');

console.log('skin written to', target);
