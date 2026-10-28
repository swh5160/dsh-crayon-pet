// Screenshots the live Web GUI through the Chrome DevTools Protocol.
// Mints the same signed browser-session cookie the shell sets after ?token= exchange,
// so a headless browser can load the authenticated app.
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const APP = process.env.APP_URL || 'http://127.0.0.1:3080';
const OUT = process.argv[2] || 'C:\\work\\code\\dsn\\art\\out\\gui.png';
const WIDTH = Number(process.env.SHOT_W || 1440);
const HEIGHT = Number(process.env.SHOT_H || 900);
const WAIT_MS = Number(process.env.SHOT_WAIT || 5200);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const NOTE = process.env.SHOT_NOTE || '';

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function secret() {
  const yaml = readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.dsh', '.credentials.yaml'), 'utf8');
  const m = yaml.match(/browser-session:[\s\S]*?secret:\s*([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('browser-session secret not found');
  return Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function cookieFor(url, key) {
  const authority = new URL(url).host;
  const name = 'dsh-auth-' + b64u(createHash('sha256').update(authority).digest());
  const now = Date.now();
  const payload = { version: 1, authority, issuedAt: now, expiresAt: now + 3600_000 };
  const body = b64u(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = b64u(createHmac('sha256', key).update(body).digest());
  return { name, value: `v1.${body}.${sig}` };
}

async function rpc(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
      else resolve(msg.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const profile = mkdtempSync(join(tmpdir(), 'cp-shot-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=9333`,
  `--user-data-dir=${profile}`, `--window-size=${WIDTH},${HEIGHT}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

let ws;
try {
  let targets = null;
  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    try {
      const res = await fetch('http://127.0.0.1:9333/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) { targets = page; break; }
    } catch { /* not up yet */ }
  }
  if (!targets) throw new Error('devtools endpoint not reachable');

  ws = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const { name, value } = cookieFor(APP, secret());
  const host = new URL(APP).hostname;
  await rpc(ws, 1, 'Network.enable');
  await rpc(ws, 2, 'Network.setCookie', { name, value, domain: host, path: '/', httpOnly: true, sameSite: 'Strict' });
  await rpc(ws, 3, 'Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: false });
  await rpc(ws, 4, 'Page.enable');
  await rpc(ws, 5, 'Page.navigate', { url: APP });

  const problems = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      problems.push('exception: ' + (msg.params?.exceptionDetails?.text || '') + ' ' + (msg.params?.exceptionDetails?.exception?.description || ''));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
      problems.push('console.error: ' + (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
    }
  });
  await rpc(ws, 8, 'Runtime.enable');

  await sleep(WAIT_MS);
  if (NOTE) {
    const r = await rpc(ws, 6, 'Runtime.evaluate', { expression: NOTE, awaitPromise: true, returnByValue: true });
    if (r && r.exceptionDetails) console.error('note failed:', JSON.stringify(r.exceptionDetails));
    else console.log('note result:', JSON.stringify(r && r.result && r.result.value));
    await sleep(900);
  }
  const shot = await rpc(ws, 7, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('wrote', OUT);
  const mine = problems.filter((p) => !/favicon|net::ERR|Failed to load resource/i.test(p));
  if (mine.length) console.log('page problems:\n' + mine.slice(0, 8).join('\n'));
  else console.log('page problems: none');
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
