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
    const WALK_SPEED = 105; // px per second

    const DICT = {
      zh: {
        builtinName: '蜡笔男孩',
        state: '动作',
        size: '大小',
        skin: '形象',
        builtin: '内置',
        hide: '先藏起来',
        show: '叫它出来',
        stroll: '溜达一下',
        tip: '左键戳一下有反应，按住可以拖走，右键打开菜单。',
        diy: '自定义形象：把 pet.json 放到 $DSH_HOME/pets/<id>/ 再打开菜单。',
        sizes: ['小', '中', '大'],
        walk: '溜达中',
        states: {
          idle: '发呆', tease: '逗你', eat: '吃饭', pancake: '我要吃煎饼', heart: '比心', face: '鬼脸',
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
        stroll: 'Take a stroll',
        tip: 'Click to poke it, drag to move, right-click for the menu.',
        diy: 'DIY skin: drop pet.json into $DSH_HOME/pets/<id>/ then reopen the menu.',
        sizes: ['S', 'M', 'L'],
        walk: 'Wandering',
        states: {
          idle: 'Idle', tease: 'Tease', eat: 'Eat', pancake: 'Pancake time!', heart: 'Love', face: 'Silly',
          work: 'Working', 'work-success': 'Done', 'work-fail': 'Oops',
          sleep: 'Sleepy', sleeping: 'Asleep', snack: 'Snack', sneeze: 'Sneeze', yawn: 'Yawn',
        },
      },
    };

    const CSS = `
.cp-wrap{position:fixed;z-index:60;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;transition:filter .2s}
.cp-wrap:hover{filter:brightness(1.02)}
.cp-wrap:active{cursor:grabbing}
.cp-flip{display:block;transform-origin:50% 100%;transition:transform .18s ease}
.cp-art{animation:cp-bob 3.4s ease-in-out infinite;transform-origin:50% 100%;
  filter:drop-shadow(0 6px 9px rgba(70,45,25,.20))}
.cp-art[data-state="work"]{animation-duration:1.5s}
.cp-art[data-state="work-success"]{animation:cp-hop .6s ease-in-out infinite}
.cp-art[data-state="work-fail"]{animation:cp-shake 1.8s ease-in-out infinite}
.cp-art[data-state="sleep"],.cp-art[data-state="sleeping"]{animation-duration:6.5s}
.cp-art[data-walk="1"]{animation:cp-walk .5s ease-in-out infinite}
.cp-svg,.cp-svg svg{width:100%;height:100%;display:block}
.cp-img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
.cp-bubble{position:absolute;left:50%;bottom:100%;transform:translate(-50%,-3px);
  padding:3px 9px;border-radius:11px;font-size:11px;line-height:1.45;white-space:nowrap;
  background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#333);
  border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));
  box-shadow:0 4px 12px rgba(0,0,0,.10);pointer-events:none}
.cp-bubble::after{content:'';position:absolute;left:50%;bottom:-4.5px;width:8px;height:8px;
  background:var(--dsw-alias-bg-overlay,#fff);
  border-right:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));
  border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));
  transform:translateX(-50%) rotate(45deg)}
@keyframes cp-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(-.7deg)}}
@keyframes cp-hop{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-10px) scale(1.04)}}
@keyframes cp-shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
@keyframes cp-walk{0%,100%{transform:translateY(0) rotate(-1.6deg)}50%{transform:translateY(-5px) rotate(1.6deg)}}
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
      const [walk, setWalk] = useState({ ms: 0, dir: 1 });

      const wrapRef = useRef(null);
      const posRef = useRef(pos);
      const dragRef = useRef(null);
      const tempRef = useRef(null);
      const walkEndRef = useRef(null);
      const walkingRef = useRef(false);
      const runningRef = useRef(false);
      const lastTouch = useRef(Date.now());
      const stateRef = useRef('idle');
      stateRef.current = state;

      useEffect(() => { posRef.current = pos; }, [pos]);

      // Pin the default right/bottom anchor to pixels, so a later walk has a
      // numeric left/top to animate from.
      useEffect(() => {
        if (pos) return;
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const pinned = { x: Math.round(r.left), y: Math.round(r.top) };
        posRef.current = pinned;
        setPos(pinned);
      }, [pos]);

      useEffect(() => {
        const onResize = () => {
          const el = wrapRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const maxX = Math.max(0, window.innerWidth - r.width);
          const maxY = Math.max(0, window.innerHeight - r.height);
          setPos((cur) => {
            if (!cur) return cur;
            const next = { x: clamp(cur.x, 0, maxX), y: clamp(cur.y, 0, maxY) };
            if (next.x === cur.x && next.y === cur.y) return cur;
            posRef.current = next;
            saveStore({ pos: next });
            return next;
          });
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
      }, []);

      const running = typeof props.useSessionStatus === 'function'
        ? props.useSessionStatus((m) => {
          if (!m || typeof m.forEach !== 'function') return false;
          let any = false;
          m.forEach((v) => { if (v && v.running) any = true; });
          return any;
        })
        : false;
      runningRef.current = running;

      const stopWalk = useCallback(() => {
        if (walkEndRef.current) {
          window.clearTimeout(walkEndRef.current);
          walkEndRef.current = null;
        }
        if (walkingRef.current) {
          walkingRef.current = false;
          setWalk({ ms: 0, dir: 1 });
          saveStore({ pos: posRef.current });
        }
      }, []);

      // A reaction is a temporary overlay: it always falls back to the base state,
      // which is `work` while the agent is running — not `idle`.
      const setTemp = useCallback((name, ms) => {
        setState(name);
        if (tempRef.current) window.clearTimeout(tempRef.current);
        tempRef.current = window.setTimeout(() => {
          setState((cur) => (cur === name ? (runningRef.current ? 'work' : 'idle') : cur));
        }, ms);
      }, []);

      useEffect(() => () => {
        if (tempRef.current) window.clearTimeout(tempRef.current);
        if (walkEndRef.current) window.clearTimeout(walkEndRef.current);
      }, []);

      const prevRunning = useRef(false);
      useEffect(() => {
        if (running) {
          if (tempRef.current) { window.clearTimeout(tempRef.current); tempRef.current = null; }
          stopWalk();
          setState('work');
        } else if (prevRunning.current) {
          setTemp('work-success', 3600);
        }
        prevRunning.current = running;
      }, [running, setTemp, stopWalk]);

      const startWalk = useCallback(() => {
        if (walkingRef.current) return;
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const margin = 18;
        const span = Math.max(1, window.innerWidth - rect.width - margin * 2);
        let targetX = margin + Math.random() * span;
        if (Math.abs(targetX - rect.left) < 70) {
          targetX = rect.left < window.innerWidth / 2
            ? margin + span * 0.75
            : margin + span * 0.25;
        }
        const from = { x: Math.round(rect.left), y: Math.round(rect.top) };
        const to = { x: Math.round(targetX), y: from.y };
        const ms = Math.round(clamp((Math.abs(to.x - from.x) / WALK_SPEED) * 1000, 900, 5200));
        const dir = to.x < from.x ? -1 : 1;
        walkingRef.current = true;
        setWalk({ ms, dir });
        setPos(to);
        posRef.current = to;
        walkEndRef.current = window.setTimeout(() => {
          walkingRef.current = false;
          walkEndRef.current = null;
          setWalk({ ms: 0, dir });
          saveStore({ pos: posRef.current });
        }, ms + 80);
      }, []);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (hidden || runningRef.current) return;
          if (walkingRef.current || stateRef.current !== 'idle') return;
          if (Date.now() - lastTouch.current < 6000) return;
          if (Math.random() > 0.7) return;
          startWalk();
        }, 7000);
        return () => window.clearInterval(id);
      }, [hidden, startWalk]);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (running || walkingRef.current || stateRef.current !== 'idle') return;
          const idle = Date.now() - lastTouch.current;
          if (idle > 240000) setState('sleeping');
          else if (idle > 150000) setState('sleep');
        }, 2000);
        return () => window.clearInterval(id);
      }, [running]);

      useEffect(() => {
        const id = window.setInterval(() => {
          if (running || walkingRef.current || stateRef.current !== 'idle' || Math.random() > 0.45) return;
          const pick = ['tease', 'face', 'yawn', 'sneeze', 'snack', 'eat', 'pancake'][Math.floor(Math.random() * 7)];
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
        stopWalk();
        if (stateRef.current === 'sleep' || stateRef.current === 'sleeping') { setState('idle'); return; }
        const pick = ['tease', 'heart', 'face', 'heart', 'sneeze'][Math.floor(Math.random() * 5)];
        setTemp(pick, 2000);
      }, [setTemp, stopWalk]);

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        stopWalk();
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
        const hgt = 380;
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
      const walking = walk.ms > 0;

      const wrapStyle = Object.assign(
        pos ? { left: pos.x + 'px', top: pos.y + 'px' } : { right: '22px', bottom: '10px' },
        walking
          ? { transition: `left ${walk.ms}ms linear, top ${walk.ms}ms linear` }
          : { transition: 'none' },
      );

      const label = walking ? t('walk') : ((dict.states && dict.states[state]) || state);

      const art = h('div', {
        className: 'cp-art',
        'data-state': state,
        'data-walk': walking ? '1' : '0',
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
        h('span', null, 'v1.2'),
      ),
      h('div', { className: 'cp-sec' }, t('state')),
      chips(ORDER.map((k) => ({ key: k, label: (dict.states && dict.states[k]) || k })), state, (k) => {
        setMenu(null);
        stopWalk();
        setTemp(k, 4200);
      }),
      h('div', { className: 'cp-sec' }, t('size')),
      chips(dict.sizes.map((label2, i) => ({ key: 's' + i, label: label2 })), 's' + scaleIdx, (k) => {
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
          onClick: () => { setMenu(null); startWalk(); },
        }, t('stroll')),
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
          ref: wrapRef,
          style: wrapStyle,
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onContextMenu: openMenu,
          onDoubleClick: () => setTemp('heart', 2000),
          onPointerEnter: () => { lastTouch.current = Date.now(); },
          title: t('tip'),
        },
        h('div', { className: 'cp-bubble' }, label),
        h('div', {
          className: 'cp-flip',
          style: { transform: walking && walk.dir < 0 ? 'scaleX(-1)' : 'none' },
        }, art)),
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
