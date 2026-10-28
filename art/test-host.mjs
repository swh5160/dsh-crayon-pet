// Offline harness: mounts the Host half with a stub ctx and prints what the
// /crayon-pet/inventory.json route would answer. Run from the package root:
//   node art/test-host.mjs
import { apply, ROUTE } from '../index.js';

let route;
const ctx = {
  effect: (fn) => fn(),
  logger: { info: (m) => console.log('[host]', m) },
  webServer: {
    register: (r) => {
      route = r;
      return () => {};
    },
  },
};

apply(ctx, {});
if (!route) throw new Error('route was not registered');
console.log('[host] route', route.kind, route.path, '=== ROUTE', ROUTE);

const chunks = [];
const res = {
  writeHead: (code, headers) => console.log('[host] status', code, headers['content-type']),
  end: (body) => chunks.push(body),
};

await route.handler({ method: 'GET' }, res);
const payload = JSON.parse(chunks.join(''));
console.log('[host] roots', payload.roots);
for (const pet of payload.pets) {
  const states = Object.keys(pet.frames);
  const bytes = states.reduce((sum, k) => sum + pet.frames[k].length, 0);
  console.log(`[host] pet id=${pet.id} name=${pet.name} source=${pet.source} states=${states.length} payload=${(bytes / 1024).toFixed(1)}KiB`);
}
