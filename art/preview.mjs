// Renders preview pages from character.mjs and screenshots them with headless Chrome.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgFor, STATES } from './character.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
mkdirSync(out, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function shoot(html, name, width, height, scale = 2, transparent = true) {
  const page = join(out, `${name}.html`);
  writeFileSync(page, html, 'utf8');
  const png = join(out, `${name}.png`);
  rmSync(png, { force: true });
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--virtual-time-budget=2500',
    `--force-device-scale-factor=${scale}`,
    `--window-size=${width},${height}`,
    transparent ? '--default-background-color=00000000' : '--default-background-color=FFFFFFFF',
    `--screenshot=${png}`,
    `file:///${page.replace(/\\/g, '/')}`,
  ], { stdio: 'pipe' });
  console.log('wrote', png);
}

const page = (body, bg = 'transparent', w = 600, h = 660) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:${bg};}
  .stage{width:${w}px;height:${h}px;display:grid;place-items:center;overflow:hidden}
  svg{display:block}
</style></head><body>${body}</body></html>`;

const which = process.argv[2] || 'idle';

if (which === 'idle') {
  shoot(page(`<div class="stage">${svgFor('idle', 520)}</div>`), 'idle', 600, 660);
} else if (which === 'state') {
  const name = process.argv[3] || 'idle';
  shoot(page(`<div class="stage">${svgFor(name, 520)}</div>`), `state-${name}`, 600, 660);
} else if (which === 'sizes') {
  const row = () => [0.55, 0.75, 1, 1.35]
    .map((k) => `<div class="slot"><div class="box">${svgFor('idle', 120 * k)}</div><div class="cap">${Math.round(120 * k)}px</div></div>`)
    .join('');
  shoot(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;font-family:ui-sans-serif,'Segoe UI',sans-serif}
    .strip{display:flex;align-items:flex-end;gap:28px;padding:26px 30px;width:820px;background:#fdf6e9}
    .slot{display:flex;flex-direction:column;align-items:center;gap:8px}
    .box{filter:drop-shadow(0 4px 6px rgba(90,70,50,.18))}
    .cap{font-size:11px;color:#8a7a6a}
    .dark{background:#1d2026}
    .dark .cap{color:#b9c2cf}
  </style></head><body>
    <div class="strip">${row()}</div>
    <div class="strip dark">${row()}</div>
  </body></html>`, 'sizes', 880, 640, 2, false);
} else if (which === 'poster') {
  const minis = STATES.map((s) => `<div class="m">${svgFor(s, 96)}<span>${s}</span></div>`).join('');
  shoot(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#fdf6e9;font-family:ui-sans-serif,'Segoe UI',sans-serif;color:#3a2a20}
    .wrap{width:1100px;padding:34px 40px}
    .top{display:flex;gap:34px;align-items:center}
    .hero{flex:0 0 300px;display:grid;place-items:center}
    .card{background:#fffdf7;border:1px dashed #e8dcc6;border-radius:26px;padding:10px 6px}
    h1{margin:0 0 6px;font-size:34px;letter-spacing:.02em}
    .en{font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#a08b74;margin:0 0 18px}
    .desc{font-size:15px;line-height:1.85;color:#5d4d3d;margin:0 0 16px}
    .dots{display:flex;gap:8px;margin-top:6px}
    .dot{width:26px;height:26px;border-radius:8px;border:2px solid #3a2a20}
    .row{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-top:26px}
    .m{background:#fffdf7;border:1px dashed #e8dcc6;border-radius:14px;padding:8px 2px 6px;display:flex;flex-direction:column;align-items:center}
    .m span{font-size:10px;color:#8a7a6a;letter-spacing:.05em;margin-top:2px}
  </style></head><body><div class="wrap">
    <div class="top">
      <div class="hero card">${svgFor('idle', 290)}</div>
      <div>
        <h1>蜡笔小新 · 桌面宠物</h1>
        <p class="en">crayon doodle desktop pet</p>
        <p class="desc">手绘蜡笔线条的小男孩：土豆形大脑袋、粗眉毛、大圆眼、红色 T 恤、蓝色短裤、白球鞋。<br>
        13 个动作状态，可拖动、可点击互动，大小和形象都能自己换。</p>
        <div class="dots">
          <div class="dot" style="background:#ea533b"></div>
          <div class="dot" style="background:#3f6fb5"></div>
          <div class="dot" style="background:#ffd9b6"></div>
          <div class="dot" style="background:#2e221a"></div>
          <div class="dot" style="background:#ffc93c"></div>
          <div class="dot" style="background:#fdf6e9"></div>
        </div>
      </div>
    </div>
    <div class="row">${minis}</div>
  </div></body></html>`, 'poster', 1180, 780, 2, false);
} else if (which === 'sheet') {
  const cols = 4;
  const cellW = 230;
  const cellH = 262;
  const cells = STATES.map((s) => `<div class="cell"><div class="art">${svgFor(s, 196)}</div><div class="label">${s}</div></div>`).join('');
  const w = cols * cellW + 40;
  const rows = Math.ceil(STATES.length / cols);
  const h = rows * cellH + 96;
  shoot(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#fdf6e9;font-family:ui-sans-serif,'Segoe UI',sans-serif}
    .wrap{padding:20px;width:${w - 40}px}
    h1{font-size:20px;margin:4px 0 2px;color:#3a2a20}
    p.sub{margin:0 0 14px;font-size:12px;color:#8a7a6a}
    .grid{display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:0}
    .cell{height:${cellH - 12}px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      border-radius:14px;background:#fffdf7;border:1px dashed #e8dcc6;margin:5px}
    .art{height:212px;display:flex;align-items:flex-end}
    .label{font-size:12px;color:#7b6a58;letter-spacing:.06em;margin-top:4px}
  </style></head><body><div class="wrap"><h1>蜡笔小新风 · 桌面宠物 状态表</h1>
  <p class="sub">crayon-doodle desktop pet / ${STATES.length} states</p><div class="grid">${cells}</div></div></body></html>`,
    'sheet', w, h, 2, false);
}
