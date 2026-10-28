// A live DSH session keeps its client module graph in memory, so replacing this
// bundle while the app runs can make the same factory register twice (old id and
// new id resolving to the same file). That duplicate is harmless — the first
// registration already installed the pet — so it must not break the boot.
try {
  window.__ModuleLoader__.load({
  id: 'dsh-crayon-pet',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useCallback } = React;

    const FRAMES = __FRAMES__;
    const ORDER = __ORDER__;
    const INVENTORY_URL = '/crayon-pet/inventory.json';
    const STORE_KEY = 'dsh.crayon-pet.v1';
    const SCALE = 128;
    const ASPECT = 220 / 200;

    const DICT = {
      zh: {
        builtinName: '蜡笔男孩',
        state: '动作',
        size: '大小',
        skin: '形象',
        builtin: '内置',
        hide: '先藏起来',
        show: '叫它出来',
        tip: '左键戳一下有反应，按住可以拖走，右键打开菜单。',
        diy: '自定义形象：把 pet.json 放到 $DSH_HOME/pets/<id>/ 再打开菜单。',
        sizes: ['小', '中', '大'],
        states: {
          idle: '发呆', tease: '逗你', eat: '吃饭', heart: '比心', face: '鬼脸',
          work: '干活中', 'work-success': '干完啦', 'work-fail': '搞砸了',
          sleep: '困了', sleeping: '睡着了', snack: '偷吃', sneeze: '打喷嚏', yawn: '打哈欠',
        },
      },
      en: {
        builtinName: 'Crayon Kid',
        state: 'Pose',
        size: 'Size',
        skin: 'Skin',
        builtin: 'Built-in',
        hide: 'Hide for now',
        show: 'Call it back',
        tip: 'Click to poke it, drag to move, right-click for the menu.',
        diy: 'DIY skin: drop pet.json into $DSH_HOME/pets/<id>/ then reopen the menu.',
        sizes: ['S', 'M', 'L'],
        states: {
          idle: 'Idle', tease: 'Tease', eat: 'Eat', heart: 'Love', face: 'Silly',
          work: 'Working', 'work-success': 'Done', 'work-fail': 'Oops',
          sleep: 'Sleepy', sleeping: 'Asleep', snack: 'Snack', sneeze: 'Sneeze', yawn: 'Yawn',
        },
      },
    };

    const CSS = `
.cp-wrap{position:fixed;z-index:60;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;transition:filter .2s}
.cp-wrap:hover{filter:brightness(1.02)}
.cp-wrap:active{cursor:grabbing}
.cp-art{animation:cp-bob 3.4s ease-in-out infinite;transform-origin:50% 100%;
  filter:drop-shadow(0 6px 9px rgba(70,45,25,.20))}
.cp-art[data-state="work"]{animation-duration:1.5s}
.cp-art[data-state="work-success"]{animation:cp-hop .6s ease-in-out infinite}
.cp-art[data-state="work-fail"]{animation:cp-shake 1.8s ease-in-out infinite}
.cp-art[data-state="sleep"],.cp-art[data-state="sleeping"]{animation-duration:6.5s}
.cp-svg,.cp-svg svg{width:100%;height:100%;display:block}
.cp-img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
@keyframes cp-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(-.7deg)}}
@keyframes cp-hop{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-10px) scale(1.04)}}
@keyframes cp-shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
.cp-menu{position:fixed;z-index:61;width:244px;box-sizing:border-box;padding:10px 10px 8px;
  background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);
  border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:14px;
  box-shadow:0 14px 38px rgba(0,0,0,.22);font-size:12px;line-height:1.4;
  font-family:inherit;pointer-events:auto}
.cp-menu-head{display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:0 2px 8px;font-weight:600;font-size:12.5px}
.cp-menu-head span{color:var(--dsw-alias-label-secondary,#777);font-weight:400;font-size:11px}
.cp-sec{margin:2px 0 6px;color:var(--dsw-alias-label-secondary,#777);font-size:11px;letter-spacing:.04em}
.cp-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.cp-chip{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:transparent;
  color:inherit;border-radius:8px;padding:3px 7px;font-size:11.5px;line-height:1.5;
  cursor:pointer;font-family:inherit;transition:background .12s,border-color .12s}
.cp-chip:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05))}
.cp-chip[data-on="1"]{border-color:var(--dsw-alias-brand-primary,#4a7dc9);
  color:var(--dsw-alias-brand-primary,#4a7dc9);background:transparent;font-weight:600}
.cp-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.cp-foot{border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));
  margin-top:2px;padding-top:7px;color:var(--dsw-alias-label-secondary,#888);font-size:10.5px;line-height:1.55}
.cp-dot{position:fixed;z-index:60;right:20px;bottom:14px;width:34px;height:34px;border-radius:50%;
  border:1px dashed rgba(120,100,80,.5);background:rgba(255,250,240,.75);opacity:.55;
  cursor:pointer;display:grid;place-items:center;padding:0;transition:opacity .15s,transform .15s}
.cp-dot:hover{opacity:1;transform:translateY(-2px)}
`;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function loadStore() {
      try {
        return JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {};
      } catch (e) {
        return {};
      }
    }

    function saveStore(patch) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(Object.assign({}, loadStore(), patch)));
      } catch (e) {
        /* private mode: settings stay session-only */
      }
    }

    function detectLang(locale) {
      try {
        const snap = locale.getLocale() || {};
        const id = snap.id || snap.locale || snap.language || '';
        if (id) return String(id).toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
      } catch (e) {
        /* fall through */
      }
      return 'zh';
    }

    function CrayonPet(props) {
      const locale = props.localeService;
      const saved = useRef(loadStore()).current;

      const [, force] = useState(0);
      useEffect(() => {
        if (!locale || typeof locale.subscribe !== 'function') return undefined;
        return locale.subscribe(() => force((n) => n + 1));
      }, [locale]);

      const lang = detectLang(locale);
      const dict = DICT[lang] || DICT.zh;
      const t = (k) => dict[k] || DICT.zh[k] || k;

      const [pos, setPos] = useState(saved.pos && typeof saved.pos.x === 'number' ? saved.pos : null);
      const [scaleIdx, setScaleIdx] = useState(typeof saved.scaleIdx === 'number' ? saved.scaleIdx : 1);
      const [petId, setPetId] = useState(typeof saved.petId === 'string' ? saved.petId : 'builtin');
      const [hidden, setHidden] = useState(!!saved.hidden);
      const [customs, setCustoms] = useState([]);
      const [menu, setMenu] = useState(null);
      const [state, setState] = useState('idle');
      const [blink, setBlink] = useState(false);

      const posRef = useRef(pos);
      const dragRef = useRef(null);
      const tempRef = useRef(null);
      const lastTouch = useRef(Date.now());
      const stateRef = useRef('idle');
      stateRef.current = state;

      useEffect(() => { posRef.current = pos; }, [pos]);

      const running = typeof props.useSessionStatus === 'function'
        ? props.useSessionStatus((m) => {
          if (!m || typeof m.forEach !== 'function') return false;
          let any = false;
          m.forEach((v) => { if (v && v.running) any = true; });
          return any;
        })
        : false;

      const setTemp = useCallback((name, ms) => {
        setState(name);
        if (tempRef.current) window.clearTimeout(tempRef.current);
        tempRef.current = window.setTimeout(() => {
          setState((cur) => (cur === name ? 'idle' : cur));
        }, ms);
      }, []);

      useEffect(() => () => {
        if (tempRef.current) window.clearTimeout(tempRef.current);
      }, []);

      const prevRunning = useRef(false);
      useEffect(() => {
        if (running) {
          if (tempRef.current) { window.clearTimeout(tempRef.current); tempRef.current = null; }
          setState('work');
        } else if (prevRunning.current) {
          setTemp('work-success', 3600);
        }
        prevRunning.current = running;
      }, [running, setTemp]);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (running || stateRef.current !== 'idle') return;
          const idle = Date.now() - lastTouch.current;
          if (idle > 240000) setState('sleeping');
          else if (idle > 150000) setState('sleep');
        }, 2000);
        return () => window.clearInterval(id);
      }, [running]);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (running || stateRef.current !== 'idle' || Math.random() > 0.45) return;
          const pick = ['tease', 'face', 'yawn', 'sneeze', 'snack', 'eat'][Math.floor(Math.random() * 6)];
          setTemp(pick, 2800);
        }, 21000);
        return () => window.clearInterval(id);
      }, [running, setTemp]);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (stateRef.current !== 'idle') return;
          setBlink(true);
          window.setTimeout(() => setBlink(false), 150);
        }, 3600);
        return () => window.clearInterval(id);
      }, []);

      const loadPets = useCallback(() => {
        if (typeof fetch !== 'function') return;
        fetch(INVENTORY_URL, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => { if (j && Array.isArray(j.pets)) setCustoms(j.pets); })
          .catch(() => { /* host route unavailable: built-in only */ });
      }, []);

      useEffect(() => { loadPets(); }, [loadPets]);

      useEffect(() => {
        if (!menu) return undefined;
        const inside = (target) => target && target.closest && target.closest('.cp-menu');
        const close = (e) => { if (!inside(e.target)) setMenu(null); };
        const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
        window.addEventListener('pointerdown', close, true);
        window.addEventListener('keydown', onKey);
        return () => {
          window.removeEventListener('pointerdown', close, true);
          window.removeEventListener('keydown', onKey);
        };
      }, [menu]);

      const poke = useCallback(() => {
        lastTouch.current = Date.now();
        if (stateRef.current === 'sleep' || stateRef.current === 'sleeping') { setState('idle'); return; }
        const pick = ['tease', 'heart', 'face', 'heart', 'sneeze'][Math.floor(Math.random() * 5)];
        setTemp(pick, 2400);
      }, [setTemp]);

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
          dx: e.clientX - rect.left, dy: e.clientY - rect.top,
          x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* no capture */ }
      };

      const onPointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) > 5) d.moved = true;
        if (!d.moved) return;
        lastTouch.current = Date.now();
        const next = {
          x: clamp(e.clientX - d.dx, 0, Math.max(0, window.innerWidth - 40)),
          y: clamp(e.clientY - d.dy, 0, Math.max(0, window.innerHeight - 40)),
        };
        posRef.current = next;
        setPos(next);
      };

      const onPointerUp = (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d) return;
        try { e.currentTarget.releasePointerCapture(d.id); } catch (err) { /* ignore */ }
        if (d.moved) {
          saveStore({ pos: posRef.current });
        } else {
          poke();
        }
      };

      const openMenu = (e) => {
        e.preventDefault();
        lastTouch.current = Date.now();
        loadPets();
        const w = 252;
        const hgt = 340;
        setMenu({
          x: clamp(e.clientX, 8, Math.max(8, window.innerWidth - w - 8)),
          y: clamp(e.clientY, 8, Math.max(8, window.innerHeight - hgt - 8)),
        });
      };

      const height = Math.round(SCALE * [0.78, 1, 1.3][scaleIdx] * ASPECT);
      const width = Math.round(height / ASPECT);

      const active = customs.find((p) => p.id === petId);
      const frameState = active ? (active.frames[state] ? state : (active.frames.idle ? 'idle' : state)) : state;
      const svg = (state === 'idle' && blink && FRAMES['idle-blink']) ? FRAMES['idle-blink'] : (FRAMES[state] || FRAMES.idle);

      const wrapStyle = pos
        ? { left: pos.x + 'px', top: pos.y + 'px' }
        : { right: '22px', bottom: '10px' };

      const art = h('div', {
        className: 'cp-art',
        'data-state': state,
        style: { width: width + 'px', height: height + 'px' },
      }, active
        ? h('img', {
          className: 'cp-img',
          src: active.frames[frameState] || active.frames.idle,
          alt: active.name,
          draggable: false,
        })
        : h('div', { className: 'cp-svg', dangerouslySetInnerHTML: { __html: svg } }));

      const chips = (items, current, onPick) => h('div', { className: 'cp-chips' },
        items.map((item) => h('button', {
          key: item.key || item,
          className: 'cp-chip',
          'data-on': (item.key || item) === current ? '1' : '0',
          onClick: () => onPick(item.key || item),
        }, item.label || item)));

      const skinItems = [{ key: 'builtin', label: t('builtin') }].concat(
        customs.map((p) => ({ key: p.id, label: p.name || p.id })),
      );

      const menuEl = menu ? h('div', {
        className: 'cp-menu',
        style: { left: menu.x + 'px', top: menu.y + 'px' },
        onContextMenu: (e) => e.preventDefault(),
      },
      h('div', { className: 'cp-menu-head' },
        h('strong', null, active ? active.name : t('builtinName')),
        h('span', null, 'v1.0'),
      ),
      h('div', { className: 'cp-sec' }, t('state')),
      chips(ORDER.map((k) => ({ key: k, label: (dict.states && dict.states[k]) || k })), state, (k) => {
        setMenu(null);
        setTemp(k, 4200);
      }),
      h('div', { className: 'cp-sec' }, t('size')),
      chips(dict.sizes.map((label, i) => ({ key: 's' + i, label })), 's' + scaleIdx, (k) => {
        const idx = Number(k.slice(1));
        setScaleIdx(idx);
        saveStore({ scaleIdx: idx });
        setMenu(null);
      }),
      h('div', { className: 'cp-sec' }, t('skin')),
      chips(skinItems, petId, (k) => {
        setPetId(k);
        saveStore({ petId: k });
        setMenu(null);
      }),
      h('div', { className: 'cp-row' },
        h('button', {
          className: 'cp-chip',
          onClick: () => { setHidden(true); saveStore({ hidden: true }); setMenu(null); },
        }, t('hide')),
      ),
      h('div', { className: 'cp-foot' }, t('tip')),
      h('div', { className: 'cp-foot' }, t('diy'))) : null;

      if (hidden) {
        return h(React.Fragment, null,
          h('style', null, CSS),
          h('button', {
            className: 'cp-dot',
            title: t('show'),
            onClick: () => { setHidden(false); saveStore({ hidden: false }); },
          }, h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true },
            h('circle', { cx: 12, cy: 9, r: 6, fill: '#ffd9b6', stroke: '#3a2a20', 'stroke-width': 1.6 }),
            h('path', { d: 'M8 3.5h8', stroke: '#3a2a20', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
            h('path', { d: 'M7 19h10', stroke: '#ea533b', 'stroke-width': 2.6, 'stroke-linecap': 'round' }))));
      }

      return h(React.Fragment, null,
        h('style', null, CSS),
        h('div', {
          className: 'cp-wrap',
          style: wrapStyle,
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onContextMenu: openMenu,
          onDoubleClick: () => setTemp('heart', 2200),
          onPointerEnter: () => { lastTouch.current = Date.now(); },
          title: t('tip'),
        }, art),
        menuEl);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const localeService = ctx.get('locale');
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'crayon-pet',
          order: 60,
        }, (props) => h(CrayonPet, Object.assign({}, props, { localeService }))));
      },
    };
  },
  });
} catch (error) {
  if (!/duplicate factory registration/i.test(String(error && error.message))) throw error;
}
