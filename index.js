// Host half of the crayon-pet bundle.
// Collects pet skins from two places and serves them to the Client as data URLs:
//   1. ./pets/**            skins that ship with this package
//   2. $DSH_HOME/pets/**    skins the user drops in (same id overrides the bundled one)
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export const name = 'crayon-pet';
export const inject = ['webServer'];

export const ROUTE = '/crayon-pet/inventory.json';
const MAX_FRAME_BYTES = 4 * 1024 * 1024;
const here = dirname(fileURLToPath(import.meta.url));
const BUNDLED_ROOT = join(here, 'pets');

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

async function readManifest(dir) {
  const raw = await readFile(join(dir, 'pet.json'), 'utf8');
  return JSON.parse(raw);
}

async function buildPet(id, dir, manifest, bound, source) {
  const declared = manifest.frames || (manifest.image ? { idle: manifest.image } : null);
  if (!declared || typeof declared !== 'object') return null;
  const frames = {};
  for (const [state, rel] of Object.entries(declared)) {
    if (typeof rel !== 'string' || rel.length === 0) continue;
    // A manifest may only point at files inside the pets root it lives in.
    const file = resolve(dir, rel);
    if (file !== bound && !file.startsWith(bound + '\\') && !file.startsWith(bound + '/')) continue;
    try {
      const info = await stat(file);
      if (!info.isFile() || info.size > MAX_FRAME_BYTES) continue;
      const bytes = await readFile(file);
      const mime = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
      frames[state] = `data:${mime};base64,${bytes.toString('base64')}`;
    } catch {
      // A missing frame falls back to the first available one on the Client.
    }
  }
  if (!Object.keys(frames).length) return null;
  return {
    id,
    name: typeof manifest.name === 'string' && manifest.name.trim() ? manifest.name.trim() : id,
    scale: typeof manifest.scale === 'number' ? manifest.scale : undefined,
    source,
    frames,
  };
}

async function scanRoot(root, source) {
  const found = [];
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return found;
  }
  const bound = resolve(root);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    try {
      const manifest = await readManifest(dir);
      const pet = await buildPet(entry.name, dir, manifest, bound, source);
      if (pet) found.push(pet);
    } catch {
      // A directory without a valid pet.json is not a pet.
    }
  }
  return found;
}

async function inventory(userRoot) {
  const merged = new Map();
  for (const pet of await scanRoot(BUNDLED_ROOT, 'bundled')) merged.set(pet.id, pet);
  // A user skin with the same id replaces the bundled art but keeps its place in the list.
  for (const pet of await scanRoot(userRoot, 'user')) merged.set(pet.id, pet);
  return [...merged.values()];
}

export function apply(ctx, config = {}) {
  const home = (config && typeof config.home === 'string' && config.home) || process.env.DSH_HOME || join(homedir(), '.dsh');
  const userRoot = join(home, 'pets');

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ROUTE,
    handler: async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('method not allowed');
        return;
      }
      const pets = await inventory(userRoot);
      const body = JSON.stringify({ roots: { bundled: BUNDLED_ROOT, user: userRoot }, pets });
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'content-length': Buffer.byteLength(body),
      });
      res.end(body);
    },
  }));

  ctx.logger?.info?.(`crayon-pet: bundled skins ${BUNDLED_ROOT}, user skins ${userRoot}`);
}
