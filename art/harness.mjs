// Component harness: runs the real client.js against a stub loader + real React,
// so pose/label/walk behaviour can be checked without the live app.
//   node art/harness.mjs <step> [--shot out.png] [--clean]
// steps: idle | work | poke | settle | pancake | carry | carryWalk | walk | walked
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = dirname(here);
const out = join(here, 'out');
mkdirSync(out, { recursive: true });

const step = process.argv[2] || 'idle';
const shotArg = process.argv.indexOf('--shot');
const shotPath = shotArg > 0 ? process.argv[shotArg + 1] : null;
const clean = process.argv.includes('--clean');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEPS = join(here, 'harness-deps');
const REACT = join(DEPS, 'node_modules', 'react', 'umd', 'react.production.min.js');
const REACT_DOM = join(DEPS, 'node_modules', 'react-dom', 'umd', 'react-dom.production.min.js');
if (!existsSync(REACT) || !existsSync(REACT_DOM)) {
  console.error('missing React UMD; run: npm install --prefix art/harness-deps react@18 react-dom@18');
  process.exit(1);
}

const client = readFileSync(join(pkg, 'client.js'), 'utf8');

const steps = {
  idle: `
    render();
    await sleep(600);
    diag({ bubble: bubble(), state: state() });`,
  work: `
    render();
    setRunning(true);
    await sleep(600);
    diag({ bubble: bubble(), state: state() });`,
  poke: `
    render();
    setRunning(true);
    await sleep(300);
    clickPet();
    await sleep(350);
    diag({ bubble: bubble(), state: state() });`,
  settle: `
    render();
    setRunning(true);
    await sleep(300);
    clickPet();
    await sleep(3200);
    diag({ bubble: bubble(), state: state(), expect: 'work' });`,
  carry: `
    render();
    await sleep(500);
    diag({ bubble: bubble(), state: state(), expect: 'pancake by default' });`,
  carryWalk: `
    render();
    await sleep(300);
    openMenu();
    await sleep(200);
    clickText(STROLL);
    await sleep(260);
    diag({ bubble: bubble(), state: state(), walkAttr: walkAttr(), expect: 'walking with the pancake' });`,
  pancake: `
    render();
    await sleep(250);
    openMenu();
    await sleep(200);
    const hit = clickText(PANCAKE);
    await sleep(400);
    diag({ chip: hit, bubble: bubble(), state: state(), expect: 'idle after putting it down' });`,
  walk: `
    render();
    await sleep(300);
    openMenu();
    await sleep(200);
    clickText(STROLL);
    await sleep(220);
    diag({ bubble: bubble(), walkAttr: walkAttr(), transition: wrap().style.transition, left: wrap().style.left });`,
  walked: `
    render();
    await sleep(300);
    openMenu();
    await sleep(200);
    clickText(STROLL);
    await sleep(6500);
    diag({ bubble: bubble(), walkAttr: walkAttr(), left: wrap().style.left, stored: localStorage.getItem('dsh.crayon-pet.v1') });`,
};

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#f6f7f9;font-family:ui-sans-serif,'Segoe UI',sans-serif}
#diag{position:fixed;left:12px;top:12px;margin:0;font:12px/1.5 ui-monospace,monospace;color:#334;background:#fff;
      padding:8px 10px;border-radius:8px;border:1px solid #dde;max-width:520px;white-space:pre-wrap}
${clean ? '#diag{display:none}' : ''}</style>
<script src="${REACT.replace(/\\/g, '/')}"></script>
<script src="${REACT_DOM.replace(/\\/g, '/')}"></script>
<script>window.__ModuleLoader__ = { load: function (def) { window.__petDef = def; } };</script>
<script>${client}</script>
</head><body><div id="root"></div><pre id="diag">running...</pre>
<script>
const STROLL = String.fromCharCode(0x6E9C, 0x8FBE, 0x4E00, 0x4E0B);
const PANCAKE = String.fromCharCode(0x6211, 0x8981, 0x5403, 0x714E, 0x997C);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diag = (v) => { document.getElementById('diag').textContent = JSON.stringify(v, null, 2); window.__diag = v; };
let status = new Map();
let root = null;
let Comp = null;
const setRunning = (on) => {
  status = new Map([['s1', { running: on }]]);
  root.render(React.createElement(Wrapper));
};
function Wrapper() {
  return React.createElement(Comp, { useSessionStatus: (sel) => sel(status) });
}
const mod = window.__petDef.factory((name) => (name === 'react' ? window.React : undefined));
const ctx = {
  get: () => ({ getLocale: () => ({ id: 'zh' }), subscribe: () => () => {} }),
  slots: { inject: (key, cb) => cb(), register: (opts, C) => { Comp = C; return () => {}; } },
};
mod.apply(ctx);
function render() {
  root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(Wrapper));
}
const wrap = () => document.querySelector('.cp-wrap');
const bubble = () => { const b = document.querySelector('.cp-bubble'); return b ? b.textContent : null; };
const state = () => { const a = document.querySelector('.cp-art'); return a ? a.getAttribute('data-state') : null; };
const walkAttr = () => { const a = document.querySelector('.cp-art'); return a ? a.getAttribute('data-walk') : null; };
const clickPet = () => {
  const el = wrap();
  const r = el.getBoundingClientRect();
  const opt = { bubbles: true, button: 0, pointerId: 3, clientX: r.left + 20, clientY: r.top + 20 };
  el.dispatchEvent(new PointerEvent('pointerdown', opt));
  el.dispatchEvent(new PointerEvent('pointerup', opt));
};
const openMenu = () => {
  const el = wrap();
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: Math.round(r.left), clientY: Math.round(r.top) }));
};
const clickText = (text) => {
  const b = [...document.querySelectorAll('.cp-chip')].find((c) => c.textContent.trim() === text);
  if (b) b.click();
  return !!b;
};
(async () => {
  try {
    ${steps[step] || steps.idle}
  } catch (e) {
    diag({ error: String(e) });
  }
  document.title = 'done';
})();
</script>
</body></html>`;

const page = join(out, `harness-${step}.html`);
writeFileSync(page, html, 'utf8');
const url = `file:///${page.replace(/\\/g, '/')}`;
// A step that shows a temporary reaction must be captured inside its window.
const budget = step === 'pancake' ? 2000 : 12000;
// A fresh profile per run keeps localStorage out of the way (carry defaults on).
const profile = mkdtempSync(join(tmpdir(), 'cp-harness-'));

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, `--virtual-time-budget=${budget}`,
  '--window-size=900,700', '--dump-dom', url,
], { stdio: 'pipe' }).toString('utf8');
writeFileSync(join(out, `harness-${step}.dom.html`), dom, 'utf8');

const m = dom.match(/<pre id="diag">([\s\S]*?)<\/pre>/);
const text = m ? m[1].replace(/&quot;/g, '"') : '(no diag)';
console.log(`${step} => ${text.length > 500 ? `${text.slice(0, 500)} ...` : text}`);

if (shotPath) {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', `--virtual-time-budget=${budget}`,
    '--force-device-scale-factor=1.5',
    '--window-size=900,700', `--screenshot=${shotPath}`, url,
  ], { stdio: 'pipe' });
  console.log('shot', shotPath);
}
