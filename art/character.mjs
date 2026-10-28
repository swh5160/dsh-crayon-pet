// Crayon-kid desktop-pet character rig.
// Every pose is generated as standalone SVG markup, so the same source feeds
// both the preview renders and the client plugin's frame table.

export const PALETTE = {
  line: '#3a2a20',
  skin: '#ffd9b6',
  skinShade: '#efb389',
  hair: '#2e221a',
  shirt: '#ea533b',
  shirtShade: '#c8412a',
  shorts: '#3f6fb5',
  shortsShade: '#345d99',
  shoe: '#fdf8ee',
  shoeTrim: '#ea533b',
  blush: '#ff9a8c',
  mouth: '#7d2f2f',
  tongue: '#ff7f88',
  white: '#ffffff',
  heart: '#ff5d7a',
  star: '#ffc93c',
  zzz: '#7aa7d9',
  sweat: '#8fd3f4',
  cushion: '#ffd166',
};

export const STATES = [
  'idle', 'tease', 'eat', 'pancake', 'heart', 'face', 'work', 'work-success',
  'work-fail', 'sleep', 'sleeping', 'snack', 'sneeze', 'yawn',
];

const C = PALETTE;

const el = (tag, attrs) => `<${tag} ${Object.entries(attrs)
  .filter(([, v]) => v !== undefined && v !== null && v !== false)
  .map(([k, v]) => `${k}="${v}"`).join(' ')}/>`;

const ink = (d, extra = {}) => el('path', {
  d, fill: 'none', stroke: C.line, 'stroke-width': 3,
  'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra,
});

const shape = (d, fill, extra = {}) => el('path', {
  d, fill, stroke: C.line, 'stroke-width': 3,
  'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra,
});

/* ---------------------------------------------------------------- paper/defs */

const defs = () => `<defs>
  <filter id="wob" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="2" seed="11" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.3" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>`;

/* ------------------------------------------------------------------- pieces */

function hairBack() {
  return shape(
    'M 57,74 C 55,42 73,28 100,28 C 127,28 145,42 143,74 L 141,88 C 126,80 118,86 100,86 C 82,86 74,80 59,88 Z',
    C.hair, { 'stroke-width': 3 },
  );
}

function headShape() {
  // potato-like head: wide cheeks, soft wide chin
  return shape(
    'M 57,74 C 55,43 72,29 100,29 C 128,29 145,43 143,74 '
    + 'C 152,92 148,110 129,120 C 118,126 82,126 71,120 C 52,110 48,92 57,74 Z',
    C.skin, { 'stroke-width': 3.4 },
  );
}

function ears() {
  return el('ellipse', { cx: 53, cy: 96, rx: 8, ry: 11, fill: C.skin, stroke: C.line, 'stroke-width': 3 })
    + el('ellipse', { cx: 147, cy: 96, rx: 8, ry: 11, fill: C.skin, stroke: C.line, 'stroke-width': 3 });
}

function hairFront() {
  const fringe = 'M 57,74 C 55,42 73,28 100,28 C 127,28 145,42 143,74 '
    + 'C 137,64 130,56 124,63 C 119,69 116,58 110,62 '
    + 'C 105,66 104,55 100,58 C 96,55 95,66 90,62 '
    + 'C 84,58 81,69 76,63 C 70,56 63,64 57,74 Z';
  const tuft = ink('M 100,29 C 99,18 106,11 114,13', { 'stroke-width': 4 });
  const tuft2 = ink('M 114,13 C 118,15 117,21 112,22', { 'stroke-width': 3.4 });
  return shape(fringe, C.hair, { 'stroke-width': 3 }) + tuft + tuft2;
}

function eye(x, y, kind, scale = 1) {
  const g = (inner) => `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
  switch (kind) {
    case 'closed':
      return g(ink('M -9,0 Q 0,7 9,0', { 'stroke-width': 3.6 }));
    case 'happy':
      return g(ink('M -10,2 Q 0,-9 10,2', { 'stroke-width': 3.8 }));
    case 'wink':
      return g(ink('M -9,1 Q 0,7 9,1', { 'stroke-width': 3.6 }));
    case 'heart':
      return g(shape('M 0,-2 C -2,-9 -12,-9 -12,0 C -12,8 0,13 0,13 C 0,13 12,8 12,0 C 12,-9 2,-9 0,-2 Z', C.heart, { 'stroke-width': 2.4 }));
    case 'dizzy':
      return g(ink('M -7,-7 L 7,7 M 7,-7 L -7,7', { 'stroke-width': 3.2 }));
    case 'squeeze':
      return g(ink('M 8,-8 L -6,0 L 8,8', { 'stroke-width': 3.4 }));
    case 'wide':
      return g(el('ellipse', { cx: 0, cy: 0, rx: 9.5, ry: 11, fill: C.white, stroke: C.line, 'stroke-width': 2.6 })
        + el('ellipse', { cx: 0, cy: 1, rx: 5, ry: 6, fill: C.line })
        + el('circle', { cx: 2, cy: -2, r: 1.8, fill: C.white }));
    default:
      return g(el('ellipse', { cx: 0, cy: 0, rx: 11.2, ry: 12.4, fill: C.line })
        + el('ellipse', { cx: 3.4, cy: -4.2, rx: 4.2, ry: 3.6, fill: C.white, opacity: 0.96 })
        + el('circle', { cx: -3.2, cy: 4.6, r: 1.7, fill: C.white, opacity: 0.6 }));
  }
}

function brow(y, kind, side) {
  const left = side < 0;
  const xo = left ? 60 : 140; // outer end
  const xi = left ? 90 : 110; // inner end
  const mid = (xo + xi) / 2;
  const paths = {
    normal: `M ${xo},${y} Q ${mid},${y - 7} ${xi},${y - 1}`,
    raised: `M ${xo},${y - 5} Q ${mid},${y - 15} ${xi},${y - 9}`,
    angry: `M ${xo},${y - 6} Q ${mid},${y - 4} ${xi},${y + 5}`,
    sad: `M ${xo},${y + 4} Q ${mid},${y - 6} ${xi},${y - 9}`,
  };
  return ink(paths[kind] || paths.normal, { 'stroke-width': 9 });
}

function mouth(x, y, kind) {
  const g = (inner) => `<g transform="translate(${x} ${y})">${inner}</g>`;
  switch (kind) {
    case 'grin':
      return g(shape('M -13,-3 Q 0,15 13,-3 Q 0,1 -13,-3 Z', C.mouth, { 'stroke-width': 2.6 })
        + el('path', { d: 'M -7,2 Q 0,8 7,2 Q 0,0 -7,2 Z', fill: C.tongue, opacity: 0.9 }));
    case 'open':
      return g(el('ellipse', { cx: 0, cy: 3, rx: 8, ry: 9, fill: C.mouth, stroke: C.line, 'stroke-width': 2.4 })
        + el('ellipse', { cx: 0, cy: 7, rx: 5, ry: 4, fill: C.tongue }));
    case 'wide':
      return g(el('ellipse', { cx: 0, cy: 7, rx: 11, ry: 14, fill: C.mouth, stroke: C.line, 'stroke-width': 2.6 })
        + el('ellipse', { cx: 0, cy: 13, rx: 7, ry: 5, fill: C.tongue }));
    case 'flat':
      return g(ink('M -8,2 L 8,2', { 'stroke-width': 3 }));
    case 'wavy':
      return g(ink('M -10,2 Q -5,-4 0,2 Q 5,8 10,2', { 'stroke-width': 3 }));
    case 'tongue':
      return g(ink('M -11,0 Q 0,7 11,0', { 'stroke-width': 3 })
        + shape('M -1,-1 C -1,10 8,11 10,4 C 10,1 6,0 3,0 Z', C.tongue, { 'stroke-width': 2.4 }));
    case 'pout':
      return g(shape('M -6,0 Q 0,-5 6,0 Q 0,7 -6,0 Z', C.mouth, { 'stroke-width': 2.2 }));
    case 'o':
      return g(el('ellipse', { cx: 0, cy: 2, rx: 4.5, ry: 5.5, fill: C.mouth, stroke: C.line, 'stroke-width': 2.2 }));
    case 'small':
      return g(ink('M -5,1 Q 0,6 5,1', { 'stroke-width': 3 }));
    default:
      return g(ink('M -10,0 Q 0,9 10,0', { 'stroke-width': 3.2 }));
  }
}

function face({ eyes: eyeKind = 'open', winkRight = false, mouth: mouthKind = 'smile', brow: browKind = 'normal', blush = 0.45, tears = false, mouthY = 114 }) {
  let out = '';
  out += el('ellipse', { cx: 65, cy: 111, rx: 9.5, ry: 6.5, fill: C.blush, opacity: blush });
  out += el('ellipse', { cx: 135, cy: 111, rx: 9.5, ry: 6.5, fill: C.blush, opacity: blush });
  out += ink('M 97,108 Q 100,105 103,108', { 'stroke-width': 2.4 });
  out += brow(78, browKind, -1) + brow(78, browKind, 1);
  out += eye(79, 96, eyeKind) + eye(121, 96, winkRight ? 'wink' : eyeKind);
  out += mouth(100, mouthY, mouthKind);
  if (tears) {
    out += shape('M 64,100 C 58,108 58,114 64,114 C 70,114 70,108 64,100 Z', C.sweat, { 'stroke-width': 2, opacity: 0.85 });
    out += shape('M 136,100 C 130,108 130,114 136,114 C 142,114 142,108 136,100 Z', C.sweat, { 'stroke-width': 2, opacity: 0.85 });
  }
  return out;
}

function head(opts = {}) {
  const { tilt = 0, x = 0, y = 0, scale = 1 } = opts;
  const inner = hairBack() + headShape() + ears() + face(opts) + hairFront();
  return `<g transform="translate(${100 + x} ${100 + y}) scale(${scale}) translate(-100 -100) rotate(${tilt} 100 105)">${inner}</g>`;
}

function torso({ shirt = C.shirt } = {}) {
  let out = '';
  // neck
  out += shape('M 93,118 L 93,136 L 107,136 L 107,118 Z', C.skin, { 'stroke-width': 2.4 });
  out += shape('M 77,132 Q 100,123 123,132 L 126,161 Q 100,169 74,161 Z', shirt);
  out += shape('M 75,154 L 73,183 Q 100,191 127,183 L 125,154 Q 100,168 75,154 Z', C.shorts);
  out += ink('M 100,163 L 100,187', { 'stroke-width': 2.2, opacity: 0.35 });
  out += ink('M 77,159 Q 100,167 123,159', { 'stroke-width': 2.4, opacity: 0.35 });
  out += ink('M 91,131 Q 100,138 109,131', { 'stroke-width': 2.6 });
  return out;
}

function arm(side, shoulder, bend, hand, { shirt = C.shirt, sleeve = 0.4 } = {}) {
  const [sx, sy] = shoulder;
  const [bx, by] = bend;
  const [hx, hy] = hand;
  const cx = sx + (bx - sx) * sleeve;
  const cy = sy + (by - sy) * sleeve;
  let out = ink(`M ${sx},${sy} L ${bx},${by} L ${hx},${hy}`, { stroke: C.skin, 'stroke-width': 11 });
  out += ink(`M ${sx},${sy} L ${cx},${cy}`, { stroke: shirt, 'stroke-width': 13.5 });
  out += el('circle', { cx: hx, cy: hy, r: 7.2, fill: C.skin, stroke: C.line, 'stroke-width': 2.8 });
  void side;
  return out;
}

function leg(hip, knee, ankle) {
  const [hx, hy] = hip;
  const [kx, ky] = knee;
  const [ax, ay] = ankle;
  return ink(`M ${hx},${hy} L ${kx},${ky} L ${ax},${ay}`, { stroke: C.skin, 'stroke-width': 12.5 });
}

function shoe(x, y, flip = 1) {
  return `<g transform="translate(${x} ${y}) scale(${flip} 1)">`
    + shape('M -11,-7 Q -14,1 -10,5 Q 2,8 15,5 Q 20,2 17,-3 Q 12,-7 3,-7 Z', C.shoe, { 'stroke-width': 3 })
    + ink('M -8,4 Q 3,7 15,4', { stroke: C.shoeTrim, 'stroke-width': 3.2 })
    + ink('M -2,-6 Q 0,-1 -2,3', { 'stroke-width': 2.2, opacity: 0.5 })
    + '</g>';
}

/* ------------------------------------------------------------------- props */

function heartProp(x, y, s = 1, fill = C.heart) {
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + shape('M 0,10 C -4,2 -18,0 -18,-10 C -18,-20 -4,-22 0,-12 C 4,-22 18,-20 18,-10 C 18,0 4,2 0,10 Z', fill, { 'stroke-width': 3 })
    + el('ellipse', { cx: -7, cy: -10, rx: 4, ry: 2.6, fill: C.white, opacity: 0.6 })
    + '</g>';
}

function onigiri(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + shape('M 0,-16 C 6,-4 14,10 12,14 Q 0,18 -12,14 C -14,10 -6,-4 0,-16 Z', C.white, { 'stroke-width': 2.8 })
    + shape('M -7,6 L 7,6 L 7,15 Q 0,17 -7,15 Z', '#2f3b34', { 'stroke-width': 2 })
    + '</g>';
}

function cookie(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + shape('M -13,0 C -13,-13 13,-13 13,0 C 13,13 -13,13 -13,0 Z', '#e5b169', { 'stroke-width': 2.8 })
    + el('circle', { cx: -4, cy: 3, r: 2.2, fill: '#6b4326' })
    + el('circle', { cx: 6, cy: -4, r: 1.8, fill: '#6b4326' })
    + el('circle', { cx: 2, cy: 7, r: 1.6, fill: '#6b4326' })
    + '</g>';
}

/** A folded jianbing held in both hands: crepe, egg, sauce, scallion, paper wrap. */
function pancake(x, y, s = 1) {
  const scallion = (cx, cy) => el('ellipse', { cx, cy, rx: 2.1, ry: 1.3, fill: '#4f9b52', transform: `rotate(-18 ${cx} ${cy})` });
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    // paper wrap
    + shape('M -16,6 L 16,6 L 13,25 Q 0,28 -13,25 Z', '#f6f0e2', { 'stroke-width': 2.6 })
    + ink('M -13,12 L 13,12', { 'stroke-width': 2, opacity: 0.3 })
    // crepe body
    + shape('M -25,-4 C -27,-20 -14,-27 0,-27 C 14,-27 27,-20 25,-4 C 23,8 12,15 0,15 C -12,15 -23,8 -25,-4 Z', '#f2c463', { 'stroke-width': 3 })
    // egg spread
    + shape('M -13,-9 C -9,-18 9,-18 13,-9 C 13,-2 -13,-2 -13,-9 Z', '#ffe9ae', { 'stroke-width': 2 })
    // crispy edge
    + ink('M -18,-2 Q 0,7 18,-2', { stroke: '#c08427', 'stroke-width': 2.6 })
    // sauce
    + ink('M -15,-13 Q -9,-8 -3,-12 Q 3,-16 9,-11 Q 13,-8 16,-11', { stroke: '#c9522f', 'stroke-width': 2.4 })
    // scallion
    + scallion(-6, -5) + scallion(2, -6) + scallion(7, -3) + scallion(-1, 4) + scallion(6, 6)
    // fold shadow
    + ink('M 0,-25 L 0,13', { 'stroke-width': 1.8, opacity: 0.18 })
    + '</g>';
}

function zzz(x, y, s = 1, opacity = 1) {
  const z = (dx, dy, k) => `<g transform="translate(${x + dx * s} ${y + dy * s}) scale(${k * s})">`
    + ink('M -6,-6 L 6,-6 L -6,6 L 6,6', { stroke: C.zzz, 'stroke-width': 4, opacity })
    + '</g>';
  return z(0, 0, 1) + z(10, -16, 0.75) + z(18, -29, 0.55);
}

function sweatDrop(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + shape('M 0,-10 C 4,-2 8,2 8,7 C 8,13 3,16 0,16 C -3,16 -8,13 -8,7 C -8,2 -4,-2 0,-10 Z', C.sweat, { 'stroke-width': 2.6 })
    + el('ellipse', { cx: -3, cy: 7, rx: 1.8, ry: 3, fill: C.white, opacity: 0.7 })
    + '</g>';
}

function spark(x, y, s = 1, fill = C.star, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">`
    + shape('M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z', fill, { 'stroke-width': 2.2 })
    + '</g>';
}

function burst(x, y, s = 1, n = 7, color = C.line) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    out += ink(
      `M ${x + Math.cos(a) * 15 * s},${y + Math.sin(a) * 15 * s} L ${x + Math.cos(a) * 29 * s},${y + Math.sin(a) * 29 * s}`,
      { stroke: color, 'stroke-width': 3.4, opacity: 0.8 },
    );
  }
  return out;
}

/* -------------------------------------------------------------------- poses */

const hands = (points) => points
  .map(([x, y]) => el('circle', { cx: x, cy: y, r: 7.2, fill: C.skin, stroke: C.line, 'stroke-width': 2.8 }))
  .join('');

function standing({ eyes = 'open', mouth: m = 'smile', brow = 'normal', tilt = 0, lean = 0,
  lArm = [[72, 138], [58, 160], [55, 179]], rArm = [[128, 138], [142, 160], [145, 179]],
  lLeg = [[88, 181], [87, 194], [87, 204]], rLeg = [[112, 181], [113, 194], [113, 204]],
  shoes = [[81, 206, -1], [119, 206, 1]], blush = 0.45, tears = false,
  winkRight = false, mouthY, shirt = C.shirt } = {}) {
  let out = `<g transform="rotate(${lean} 100 175)">`;
  out += leg(lLeg[0], lLeg[1], lLeg[2], { shorts: C.shorts });
  out += leg(rLeg[0], rLeg[1], rLeg[2], { shorts: C.shorts });
  out += shoe(shoes[0][0], shoes[0][1], shoes[0][2]);
  out += shoe(shoes[1][0], shoes[1][1], shoes[1][2]);
  out += torso({ shirt });
  out += arm(-1, lArm[0], lArm[1], lArm[2], { shirt });
  out += arm(1, rArm[0], rArm[1], rArm[2], { shirt });
  out += head({ eyes, mouth: m, brow, tilt, blush, tears, winkRight, mouthY });
  out += '</g>';
  return out;
}

/* ------------------------------------------------------------------- frames */

export function render(state) {
  let body = '';
  let props = '';
  switch (state) {
    case 'idle':
      body = standing();
      break;
    case 'idle-blink':
      body = standing({ eyes: 'closed' });
      break;
    case 'tease':
      body = standing({
        eyes: 'open', mouth: 'tongue', brow: 'raised', tilt: -6, lean: 3,
        lArm: [[74, 138], [64, 116], [66, 98]],
        rArm: [[126, 138], [140, 150], [146, 162]],
      });
      break;
    case 'eat':
      body = standing({
        eyes: 'happy', mouth: 'open', tilt: 3,
        lArm: [[72, 138], [78, 128], [88, 126]],
        rArm: [[128, 138], [122, 128], [112, 126]],
      });
      props = onigiri(100, 130, 1.2) + hands([[88, 126], [112, 126]]);
      break;
    case 'pancake':
      body = standing({
        eyes: 'happy', mouth: 'open', mouthY: 108, brow: 'raised', tilt: -4, lean: -2, blush: 0.62,
        lArm: [[72, 138], [56, 158], [76, 148]],
        rArm: [[128, 138], [144, 158], [124, 148]],
      });
      props = pancake(100, 148, 1) + hands([[76, 144], [124, 144]])
        + ink('M 46,80 Q 40,90 46,100', { stroke: '#b9a184', 'stroke-width': 3.4, opacity: 0.8 })
        + ink('M 36,75 Q 28,90 36,105', { stroke: '#b9a184', 'stroke-width': 3.4, opacity: 0.5 })
        + ink('M 154,80 Q 160,90 154,100', { stroke: '#b9a184', 'stroke-width': 3.4, opacity: 0.8 })
        + ink('M 164,75 Q 172,90 164,105', { stroke: '#b9a184', 'stroke-width': 3.4, opacity: 0.5 });
      break;
    case 'heart':
      body = standing({
        eyes: 'heart', mouth: 'grin', blush: 0.75,
        lArm: [[74, 138], [78, 150], [88, 154]],
        rArm: [[126, 138], [122, 150], [112, 154]],
      });
      props = heartProp(100, 150, 1.25) + hands([[88, 150], [112, 150]]) + spark(50, 64, 0.5) + spark(150, 66, 0.42, C.heart);
      break;
    case 'face':
      body = standing({ eyes: 'open', winkRight: true, mouth: 'tongue', brow: 'raised', tilt: 5 });
      props = spark(44, 56, 0.5) + spark(158, 98, 0.4, C.heart);
      break;
    case 'work':
      body = standing({
        eyes: 'open', mouth: 'flat', tilt: 2,
        lArm: [[74, 138], [72, 152], [84, 160]],
        rArm: [[126, 138], [128, 152], [116, 160]],
        lLeg: [[86, 178], [74, 190], [76, 202]],
        rLeg: [[114, 178], [126, 190], [124, 202]],
        shoes: [[70, 204, -1], [130, 204, 1]],
      });
      props = `<g transform="translate(100 154)">`
        + shape('M -26,-17 L 26,-17 L 26,8 L -26,8 Z', '#5b6f8c', { 'stroke-width': 2.8 })
        + shape('M -22,-13 L 22,-13 L 22,3 L -22,3 Z', '#bfe3f7', { 'stroke-width': 0 })
        + shape('M -31,8 L 31,8 L 35,14 L -35,14 Z', '#8ea3bd', { 'stroke-width': 2.6 })
        + ink('M -16,-5 L -6,-5', { stroke: '#ffffff', 'stroke-width': 2.4, opacity: 0.9 })
        + ink('M -16,1 L 2,1', { stroke: '#ffffff', 'stroke-width': 2.4, opacity: 0.7 })
        + '</g>';
      break;
    case 'work-success':
      body = standing({
        eyes: 'happy', mouth: 'grin', brow: 'raised', lean: -2,
        lArm: [[74, 138], [56, 110], [52, 86]],
        rArm: [[126, 138], [144, 110], [148, 86]],
      });
      props = spark(38, 64, 0.75) + spark(162, 60, 0.6, C.star, 20)
        + spark(62, 30, 0.45, C.heart) + spark(140, 26, 0.5, C.star, -15);
      break;
    case 'work-fail':
      body = standing({
        eyes: 'dizzy', mouth: 'wavy', brow: 'sad', tilt: -8, lean: 4,
        lArm: [[74, 138], [64, 152], [70, 166]],
        rArm: [[126, 138], [136, 152], [130, 166]],
        lLeg: [[88, 178], [82, 192], [78, 202]],
        rLeg: [[112, 178], [120, 192], [124, 202]],
      });
      props = sweatDrop(148, 70, 1) + `<g opacity="0.65">${burst(100, 38, 0.8, 5, '#b9b2a6')}</g>`;
      break;
    case 'sleep':
      body = standing({
        eyes: 'closed', mouth: 'small', tilt: -10, lean: 5,
        lArm: [[74, 138], [68, 152], [62, 166]],
        rArm: [[126, 138], [132, 152], [138, 166]],
      });
      props = zzz(150, 64, 1);
      break;
    case 'sleeping':
      body = standing({
        eyes: 'closed', mouth: 'small', tilt: -12, lean: 6,
        lArm: [[74, 138], [70, 152], [64, 164]],
        rArm: [[126, 138], [130, 152], [136, 164]],
      });
      props = `<g opacity="0.96">`
        + shape('M 52,152 C 52,130 74,122 100,122 C 126,122 148,130 148,152 L 144,174 Q 100,184 56,174 Z', C.cushion, { 'stroke-width': 3 })
        + ink('M 62,148 Q 100,160 138,148', { 'stroke-width': 2.2, opacity: 0.45 })
        + ink('M 66,164 Q 100,174 134,164', { 'stroke-width': 2.2, opacity: 0.3 })
        + '</g>' + zzz(152, 62, 1);
      break;
    case 'snack':
      body = standing({
        eyes: 'happy', mouth: 'open', tilt: 2,
        lArm: [[72, 138], [80, 132], [96, 124]],
        rArm: [[128, 138], [132, 140], [128, 132]],
      });
      props = cookie(128, 132, 1.05) + hands([[128, 132]]) + el('circle', { cx: 84, cy: 136, r: 1.8, fill: '#a8794a' })
        + el('circle', { cx: 90, cy: 140, r: 1.4, fill: '#a8794a' });
      break;
    case 'sneeze':
      body = standing({
        eyes: 'squeeze', mouth: 'open', brow: 'angry', tilt: 8, lean: 8,
        lArm: [[74, 138], [58, 142], [50, 136]],
        rArm: [[126, 138], [140, 144], [148, 140]],
      });
      props = burst(34, 100, 1, 6, '#9bb6c9') + sweatDrop(68, 58, 0.8);
      break;
    case 'yawn':
      body = standing({
        eyes: 'closed', mouth: 'wide', brow: 'raised', tilt: -4, tears: true,
        lArm: [[74, 138], [84, 120], [96, 114]],
        rArm: [[126, 138], [138, 150], [144, 162]],
      });
      break;
    default:
      body = standing();
  }
  return `${defs()}<g filter="url(#wob)">${body}${props}</g>`;
}

export function svgFor(state, size = 220) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="${size}" height="${(size * 220) / 200}">${render(state)}</svg>`;
}
