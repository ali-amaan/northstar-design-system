// The fifteen approved star backdrops, ported from the design canvas. Each
// scene is a pure `build(share)` (the design's own generator, unchanged, then
// thinned to the density) and a `render(data, id)` that draws it in the
// 720 × 450 design frame. 2D scenes are one SVG; the 3D ones are CSS
// preserve-3d scenes whose stars counter-rotate (billboard) to face the viewer.
// Timings live in backdrops.css; per-element phase is `--ns-bd-d` (seconds).
import type { CSSProperties, ReactNode } from 'react';
import { CAP, DENSITY, FRAME, GOLDEN, STAR, f1, f2, lcg, thin, type BackdropDensity } from './math.js';

export const BACKDROP_VARIANTS = [
  'constellation-atlas',
  'orrery',
  'golden-angle',
  'prime-lattice',
  'meridian-sweep',
  'interference',
  'celestial-sphere',
  'fibonacci-sphere',
  'star-torus',
  'double-helix',
  'wave-surface',
  'twin-vortex',
  'drifting-blooms',
  'mobius',
  'galaxy-3d',
] as const;

export type BackdropVariant = (typeof BACKDROP_VARIANTS)[number];

interface Scene<D> {
  kind: '2d' | '3d';
  build: (share: number) => D;
  render: (data: D, id: string) => ReactNode;
}

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** A star in a 2D scene. `a` marks a Glacier (signal) star. */
interface Pt {
  x: string;
  y: string;
  r: string | number;
  a?: boolean;
  d?: string;
  o?: string;
  keep?: boolean;
}

function star(p: Pt, key: number | string, className?: string, extra?: Record<string, string | number>) {
  const cls = [p.a ? 'ns-bd-a' : '', className ?? ''].join(' ').trim() || undefined;
  const style = p.d !== undefined || extra ? v({ ...(p.d !== undefined ? { '--ns-bd-d': p.d } : {}), ...extra }) : undefined;
  return <path key={key} d={STAR} transform={`translate(${p.x} ${p.y}) scale(${p.r})`} className={cls} style={style} opacity={p.o} />;
}

/** A star whose own transform animates: placed by a <g>, animated inside it. */
function wrapped(p: Pt, key: number | string, className: string) {
  return (
    <g key={key} transform={`translate(${p.x} ${p.y}) scale(${p.r})`}>
      <path d={STAR} className={p.a ? `ns-bd-a ${className}` : className} style={p.d !== undefined ? v({ '--ns-bd-d': p.d }) : undefined} opacity={p.o} />
    </g>
  );
}

function svg(children: ReactNode) {
  return (
    <svg className="ns-bd-svg" viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" focusable="false">
      {children}
    </svg>
  );
}

function radial(id: string, color: string, stops: Array<[number, string]>) {
  return (
    <radialGradient id={id}>
      {stops.map(([offset, opacity]) => (
        <stop key={offset} offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
      ))}
    </radialGradient>
  );
}

const INK = 'var(--ns-backdrop-ink)';
const SIGNAL = 'var(--ns-backdrop-signal)';

/* ------------------------------------------------- 1 · Constellation atlas */

const constellation: Scene<{ far: Pt[]; mid: Pt[]; nodes: Pt[]; links: Array<{ x1: string; y1: string; x2: string; y2: string; d: string }> }> = {
  kind: '2d',
  build(share) {
    const rnd = lcg(20261027);
    const far: Pt[] = [];
    const mid: Pt[] = [];
    const nodes: Pt[] = [];
    const links: Array<{ x1: string; y1: string; x2: string; y2: string; d: string }> = [];
    for (let i = 0; i < 160; i++) far.push({ x: f1(rnd() * 840), y: f1(rnd() * 480), r: f2(1 + rnd()) });
    for (let i = 0; i < 70; i++) mid.push({ x: f1(rnd() * 860), y: f1(rnd() * 490), r: f2(2 + rnd() * 1.2), d: f2(rnd() * 6) });
    const centres = [[150, 300], [330, 120], [470, 380], [600, 150], [760, 300], [250, 420]] as const;
    centres.forEach(([cx, cy], c) => {
      const pts: Array<[number, number]> = [];
      for (let k = 0; k < 5; k++) {
        const a = rnd() * Math.PI * 2;
        const r = 25 + rnd() * 60;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      pts.sort((p, q) => p[0] - q[0]);
      pts.forEach((p, k) => {
        nodes.push({ x: f1(p[0]), y: f1(p[1]), r: k === 2 ? 5.5 : 3.4, a: k === 2, d: (c + k * 0.4).toFixed(1) });
        const q = pts[k - 1];
        if (q) links.push({ x1: f1(q[0]), y1: f1(q[1]), x2: f1(p[0]), y2: f1(p[1]), d: (c * 2.2 + k * 0.3).toFixed(1) });
      });
    });
    return { far: thin(far, share), mid: thin(mid, share), nodes, links };
  },
  render({ far, mid, nodes, links }, id) {
    return svg(
      <>
        <defs>
          {radial(`${id}-g1`, SIGNAL, [[0, 'var(--ns-backdrop-glow-nebula)'], [1, '0']])}
          {radial(`${id}-g2`, INK, [[0, 'var(--ns-backdrop-glow-haze)'], [1, '0']])}
        </defs>
        <ellipse cx="200" cy="160" rx="300" ry="190" fill={`url(#${id}-g1)`} className="ns-bd-neb" />
        <ellipse cx="560" cy="330" rx="280" ry="170" fill={`url(#${id}-g2)`} className="ns-bd-neb" style={v({ '--ns-bd-d': -20 })} />
        <g className="ns-bd-far">{far.map((s, i) => star({ ...s, o: '0.45' }, i))}</g>
        <g className="ns-bd-mid">{mid.map((s, i) => star(s, i, 'ns-bd-tw'))}</g>
        <g className="ns-bd-near">
          {links.map((l, i) => (
            <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="ns-bd-link" style={v({ '--ns-bd-d': l.d })} />
          ))}
          {nodes.map((s, i) => star(s, `n${i}`, 'ns-bd-tw'))}
        </g>
      </>,
    );
  },
};

/* --------------------------------------------------------------- 2 · Orrery */

interface Orbit {
  r: number;
  bodies: Pt[];
  t: number;
  d: number;
  accent: boolean;
  w: number;
  dash: string | undefined;
}

const orrery: Scene<{ orbits: Orbit[]; spokes: Array<{ x: string; y: string; keep?: boolean }> }> = {
  kind: '2d',
  build(share) {
    const fib = [1, 2, 3, 5, 8, 13, 21, 34];
    const orbits = fib.map((f, i): Orbit => {
      const r = 42 + i * 44;
      const n = 1 + (i % 3);
      const bodies: Pt[] = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + i;
        const lead = i === 2 && k === 0;
        bodies.push({ x: f1(430 + r * Math.cos(a)), y: f1(250 + r * Math.sin(a)), r: lead ? 6 : f2(3.6 - i * 0.2), a: lead });
      }
      return { r, bodies, t: f * 6, d: -i * 3, accent: i === 2, w: i === 2 ? 0.8 : 0.5, dash: i % 2 ? '2 6' : undefined };
    });
    const spokes: Array<{ x: string; y: string; keep?: boolean }> = [];
    for (let a = 0; a < 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      spokes.push({ x: f1(430 + 420 * Math.cos(rad)), y: f1(250 + 420 * Math.sin(rad)), keep: a % 90 === 0 });
    }
    return { orbits, spokes: thin(spokes, Math.max(share, 0.5)) };
  },
  render({ orbits, spokes }, id) {
    return svg(
      <>
        <defs>{radial(`${id}-core`, SIGNAL, [[0, 'var(--ns-backdrop-glow-core)'], [0.45, 'var(--ns-backdrop-glow-core-soft)'], [1, '0']])}</defs>
        <circle cx="430" cy="250" r="330" fill={`url(#${id}-core)`} className="ns-bd-core" />
        {spokes.map((s, i) => (
          <line key={`s${i}`} x1="430" y1="250" x2={s.x} y2={s.y} className="ns-bd-spoke" />
        ))}
        {orbits.map((o, i) => (
          <g key={`o${i}`}>
            <circle cx="430" cy="250" r={o.r} fill="none" className={o.accent ? 'ns-bd-ring ns-bd-ring--a' : 'ns-bd-ring'} strokeWidth={o.w} strokeDasharray={o.dash} />
            <g className="ns-bd-orbit" style={v({ '--ns-bd-t': o.t, '--ns-bd-d': o.d })}>
              {o.bodies.map((b, k) => star(b, k))}
            </g>
          </g>
        ))}
        <path d={STAR} transform="translate(430 250) scale(11)" className="ns-bd-a" />
      </>,
    );
  },
};

/* ------------------------------------------------------ 3 · Golden-angle field */

const goldenAngle: Scene<{ pts: Pt[] }> = {
  kind: '2d',
  build(share) {
    const pts: Pt[] = [];
    for (let i = 1; i < 220; i++) {
      const r = 13 * Math.sqrt(i);
      const a = i * GOLDEN;
      const big = i % 21 === 0;
      pts.push({ x: f1(560 + r * Math.cos(a)), y: f1(225 + r * Math.sin(a)), r: big ? 5 : 2.4, a: big, keep: big, d: f2(i * 0.03) });
    }
    return { pts: thin(pts, share) };
  },
  render({ pts }) {
    return svg(<g className="ns-bd-phyllo">{pts.map((p, i) => star(p, i, 'ns-bd-pulse'))}</g>);
  },
};

/* ----------------------------------------------------------- 5 · Prime lattice */

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
};

const primeLattice: Scene<{ dots: Pt[] }> = {
  kind: '2d',
  build(share) {
    const dots: Pt[] = [];
    for (let n = 1; n <= 540; n++) {
      const i = n - 1;
      const p = isPrime(n);
      const x = f1(20 + (i % 36) * 19.4);
      const y = String(30 + Math.floor(i / 36) * 25);
      dots.push(p ? { x, y, r: 4.5, a: true, keep: true, d: ((n % 70) / 10).toFixed(1) } : { x, y, r: 1.8 });
    }
    // Primes always stay; density thins the unlit composites (low keeps about a third).
    return { dots: thin(dots, share) };
  },
  render({ dots }) {
    return svg(dots.map((d, i) => (d.a ? star(d, i, 'ns-bd-prime') : star(d, i, 'ns-bd-f'))));
  },
};

/* ---------------------------------------------------------- 6 · Meridian sweep */

const meridian: Scene<{ arcs: number[]; ticks: Array<{ x1: string; y1: string; x2: string; y2: string }> }> = {
  kind: '2d',
  build() {
    const ticks: Array<{ x1: string; y1: string; x2: string; y2: string }> = [];
    for (let a = -70; a <= 70; a += 5) {
      const rad = ((a - 90) * Math.PI) / 180;
      const r1 = 580;
      const r2 = a % 10 === 0 ? 560 : 570;
      ticks.push({ x1: f1(360 + r1 * Math.cos(rad)), y1: f1(620 + r1 * Math.sin(rad)), x2: f1(360 + r2 * Math.cos(rad)), y2: f1(620 + r2 * Math.sin(rad)) });
    }
    return { arcs: [160, 300, 440, 580], ticks };
  },
  render({ arcs, ticks }) {
    return svg(
      <>
        {arcs.map((r) => (
          <circle key={r} cx="360" cy="620" r={r} fill="none" className="ns-bd-line" strokeWidth="0.5" />
        ))}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className="ns-bd-line" strokeWidth="0.6" />
        ))}
        <g className="ns-bd-sweep">
          <line x1="360" y1="620" x2="360" y2="40" className="ns-bd-beam" />
          <path d="M360 32 L362 38 L368 40 L362 42 L360 48 L358 42 L352 40 L358 38 Z" className="ns-bd-a" />
        </g>
      </>,
    );
  },
};

/* ------------------------------------------------------ 7 · Interference field */

const interference: Scene<{ dots: Pt[] }> = {
  kind: '2d',
  build(share) {
    const dots: Pt[] = [];
    for (let row = 0; row < 14; row++)
      for (let i = 0; i < 40; i++) {
        const x = 9 + i * 18 + (row % 2) * 9;
        const y = 20 + row * 31 + 10 * Math.sin(i / 4 + row / 2) + 6 * Math.sin(i / 9 - row / 3);
        const mid = Math.abs(row - 6.5) / 6.5;
        const lead = row === 7 && i === 22;
        dots.push({ x: String(x), y: f1(y), r: lead ? 6 : f2(2.6 - mid * 1.1), a: lead, keep: lead, o: lead ? '1' : f2(1 - mid * 0.65), d: f2(-(i * 0.18) - row * 0.35) });
      }
    return { dots: thin(dots, share) };
  },
  render({ dots }, id) {
    return svg(
      <>
        <defs>
          <linearGradient id={`${id}-bd`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: SIGNAL, stopOpacity: 0 }} />
            <stop offset="0.5" style={{ stopColor: SIGNAL, stopOpacity: 'var(--ns-backdrop-glow-band)' }} />
            <stop offset="1" style={{ stopColor: SIGNAL, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <rect x="0" y="120" width="720" height="220" fill={`url(#${id}-bd)`} className="ns-bd-band" />
        {dots.map((d, i) => wrapped(d, i, 'ns-bd-bob'))}
      </>,
    );
  },
};

/* -------------------------------------------------------- 8 · Celestial sphere */

const sphere: Scene<{ lats: Array<{ y: string; rx: string; ry: string }>; mers: Array<{ d: string; a: boolean }>; stars: Pt[] }> = {
  kind: '2d',
  build(share) {
    const lats = [-60, -30, 0, 30, 60].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return { y: f1(225 - 170 * Math.sin(a)), rx: f1(170 * Math.cos(a)), ry: f1(24 * Math.cos(a)) };
    });
    const mers = [0, 1, 2, 3, 4, 5].map((i) => ({ d: f2((-i * 32) / 12), a: i === 0 }));
    const rnd = lcg(7);
    const stars: Pt[] = [];
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 160;
      stars.push({ x: f1(520 + r * Math.cos(a)), y: f1(225 + r * Math.sin(a)), r: 2.4, d: f2(rnd() * 5) });
    }
    return { lats, mers, stars: thin(stars, share) };
  },
  render({ lats, mers, stars }) {
    return svg(
      <>
        <circle cx="520" cy="225" r="170" fill="none" className="ns-bd-line" strokeWidth="0.7" />
        {lats.map((l, i) => (
          <ellipse key={`l${i}`} cx="520" cy={l.y} rx={l.rx} ry={l.ry} fill="none" className="ns-bd-line" strokeWidth="0.5" />
        ))}
        {mers.map((m, i) => (
          <ellipse key={`m${i}`} cx="520" cy="225" rx="170" ry="170" fill="none" className={m.a ? 'ns-bd-mer ns-bd-mer--a' : 'ns-bd-mer'} strokeWidth="0.6" style={v({ '--ns-bd-d': m.d })} />
        ))}
        {stars.map((s, i) => star(s, `s${i}`, 'ns-bd-tw'))}
        <path d="M520 47 L522 53 L528 55 L522 57 L520 63 L518 57 L512 55 L518 53 Z" className="ns-bd-a" />
      </>,
    );
  },
};

/* ----------------------------------------------------------- P5 · Twin vortex */

const PHI = (1 + Math.sqrt(5)) / 2;
const SPIRAL_B = Math.log(PHI) / (Math.PI / 2);

const vortex: Scene<{ pts: Pt[] }> = {
  kind: '2d',
  build(share) {
    const rnd = lcg(3);
    const pts: Pt[] = [];
    for (let arm = 0; arm < 2; arm++)
      for (let i = 0; i < 260; i++) {
        const t = i * 0.045;
        const r = 14 * Math.exp(SPIRAL_B * t);
        if (r > 520) break;
        const spread = 0.12 + r / 900;
        const a = t + arm * Math.PI + (rnd() - 0.5) * spread * 2;
        const rr = r * (1 + (rnd() - 0.5) * spread);
        const x = 470 + rr * Math.cos(a);
        const y = 225 + rr * Math.sin(a) * 0.82;
        if (x < -10 || x > 730 || y < -10 || y > 460) continue;
        const big = i % 29 === 0;
        pts.push({ x: f1(x), y: f1(y), r: big ? 4 : f2(1.6 + r / 300), a: big, keep: big, d: f2(-(r / 90)) });
      }
    for (let i = 0; i < 90; i++) {
      const x = rnd() * 720;
      const y = rnd() * 450;
      pts.push({ x: f1(x), y: f1(y), r: 1.4, d: f2(rnd() * 6) });
    }
    return { pts: thin(pts, share) };
  },
  render({ pts }) {
    return svg(
      <>
        <g className="ns-bd-vortex">{pts.map((p, i) => wrapped(p, i, 'ns-bd-throb'))}</g>
        <path d={STAR} transform="translate(470 225) scale(9)" className="ns-bd-a" />
      </>,
    );
  },
};

/* -------------------------------------------------------- P7 · Drifting blooms */

const blooms: Scene<{ blooms: Array<{ pts: Pt[]; d: string }> }> = {
  kind: '2d',
  build(share) {
    const spec = [[610, 90, 1], [660, 380, 1], [90, 380, 2], [250, 70, 3], [120, 200, 5], [560, 250, 8], [330, 290, 13]] as const;
    return {
      blooms: spec.map(([cx, cy, f], j) => {
        const R = 14 + f * 13;
        const n = Math.round((R * R) / 36);
        const pts: Pt[] = [];
        for (let i = 1; i <= n; i++) {
          const r = R * Math.sqrt(i / n);
          const a = i * GOLDEN;
          const big = i === n || i % 34 === 0;
          pts.push({ x: f1(cx + r * Math.cos(a)), y: f1(cy + r * Math.sin(a)), r: big ? 3.6 : 1.9, a: big, keep: big, d: f2(j * 0.9 + (r / R) * 2.4) });
        }
        return { pts: thin(pts, share), d: (-j * 4.3).toFixed(1) };
      }),
    };
  },
  render({ blooms: list }) {
    return svg(
      list.map((b, j) => (
        <g key={j} className="ns-bd-drift" style={v({ '--ns-bd-d': b.d })}>
          {b.pts.map((p, i) => wrapped(p, i, 'ns-bd-throb'))}
        </g>
      )),
    );
  },
};

/* ------------------------------------------------------------ 3D star forms */

/** A star in a 3D scene: position (px), size (px), signal or ink, phase (s). */
interface P3 {
  x: string;
  y: string;
  z: string;
  s: string | number;
  a?: boolean;
  d: string;
  keep?: boolean;
}

/** Camera and motion of a 3D scene, exactly as designed. */
interface Rig {
  /** Centre of the form in the 720 × 450 frame. */
  left: number;
  top: number;
  perspective: number;
  /** The tilt of the form; the billboard undoes it after undoing the turn. */
  tilt: string;
  bill: string;
  /** One turn about the vertical axis, in seconds; `turn` is +360deg or -360deg. */
  period: number;
  turn: '360deg' | '-360deg';
  /** `fade`: opacity .2 to 1. `rise`: .18 to 1 while lifting 12px. */
  pulse: 'fade' | 'rise';
  /** Pulse period, seconds. */
  beat: number;
}

function scene3d(rig: Rig, pts: P3[]) {
  return (
    <div className="ns-bd-stage">
      <div className="ns-bd-view" style={{ perspective: `${rig.perspective}px` }}>
        <div
          className="ns-bd-tilt"
          style={v({ left: `${rig.left}px`, top: `${rig.top}px`, transform: rig.tilt, '--ns-bd-bill': rig.bill, '--ns-bd-turn': rig.turn, '--ns-bd-period': rig.period, '--ns-bd-beat': rig.beat })}
        >
          <div className="ns-bd-scene">
            {pts.map((p, i) => (
              <span key={i} className="ns-bd-b" style={v({ '--ns-bd-p': `${p.x}px,${p.y}px,${p.z}px`, '--ns-bd-s': p.s, '--ns-bd-d': p.d })}>
                <span className={p.a ? `ns-bd-s ns-bd-s--${rig.pulse} ns-bd-a` : `ns-bd-s ns-bd-s--${rig.pulse}`} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function form(rig: Rig, generate: () => P3[]): Scene<P3[]> {
  return { kind: '3d', build: (share) => thin(generate(), share), render: (pts) => scene3d(rig, pts) };
}

const fibonacciSphere = form({ left: 470, top: 225, perspective: 900, tilt: 'rotateX(-16deg)', bill: 'rotateX(16deg)', period: 48, turn: '360deg', pulse: 'fade', beat: 6 }, () => {
  const N = 420;
  const R = 170;
  const pts: P3[] = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const t = i * GOLDEN;
    const big = i % 34 === 0;
    pts.push({ x: f1(R * r * Math.cos(t)), y: f1(R * y), z: f1(R * r * Math.sin(t)), s: big ? 10 : 5, a: big, keep: big, d: f2((y + 1) * 3) });
  }
  return pts;
});

const starTorus = form({ left: 470, top: 225, perspective: 900, tilt: 'rotateX(58deg)', bill: 'rotateX(-58deg)', period: 60, turn: '360deg', pulse: 'fade', beat: 6 }, () => {
  const R = 165;
  const r = 58;
  const U = 56;
  const V = 9;
  const pts: P3[] = [];
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const u = (i / U) * Math.PI * 2;
      const w = (j / V) * Math.PI * 2 + i * 0.35;
      const big = j === 0 && i % 7 === 0;
      pts.push({
        x: f1((R + r * Math.cos(w)) * Math.cos(u)),
        y: f1(r * Math.sin(w)),
        z: f1((R + r * Math.cos(w)) * Math.sin(u)),
        s: big ? 10 : 5,
        a: big,
        keep: big,
        d: f2(((w % (Math.PI * 2)) / Math.PI) * 3),
      });
    }
  return pts;
});

const doubleHelix = form({ left: 400, top: 225, perspective: 900, tilt: 'rotateZ(62deg)', bill: 'rotateX(0deg) rotateZ(-62deg)', period: 30, turn: '360deg', pulse: 'fade', beat: 5 }, () => {
  const pts: P3[] = [];
  const R = 80;
  const H = 720;
  const turns = 3.5;
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = (t - 0.5) * H;
    const a = t * turns * Math.PI * 2;
    for (let k = 0; k < 2; k++) {
      const ang = a + k * Math.PI;
      const big = i % 12 === 0 && k === 0;
      pts.push({ x: f1(R * Math.cos(ang)), y: f1(y), z: f1(R * Math.sin(ang)), s: big ? 10 : 5.5, a: big, keep: big, d: f2(t * 5) });
    }
    if (i % 4 === 0)
      for (let m = 1; m < 5; m++) {
        const f = (m / 5) * 2 - 1;
        pts.push({ x: f1(R * f * Math.cos(a)), y: f1(y), z: f1(R * f * Math.sin(a)), s: 3, d: f2(t * 5 + 0.3) });
      }
  }
  return pts;
});

const waveSurface = form({ left: 400, top: 250, perspective: 800, tilt: 'rotateX(-30deg)', bill: 'rotateX(30deg)', period: 90, turn: '360deg', pulse: 'rise', beat: 5 }, () => {
  const pts: P3[] = [];
  const n = 22;
  const span = 560;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = (i / (n - 1) - 0.5) * span;
      const z = (j / (n - 1) - 0.5) * span;
      const y = -36 * Math.sin(x / 70) * Math.cos(z / 70);
      const dist = Math.sqrt(x * x + z * z);
      const big = i === 11 && j === 11;
      pts.push({ x: f1(x), y: f1(y), z: f1(z), s: big ? 11 : 5, a: big, keep: big, d: f2(dist / 70) });
    }
  return pts;
});

const mobius = form({ left: 470, top: 225, perspective: 900, tilt: 'rotateX(24deg)', bill: 'rotateX(-24deg)', period: 54, turn: '360deg', pulse: 'fade', beat: 6 }, () => {
  const pts: P3[] = [];
  const R = 175;
  const W = 62;
  const U = 90;
  const V = 7;
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const u = (i / U) * Math.PI * 2;
      const w = (j / (V - 1)) * 2 - 1;
      const k = R + w * W * Math.cos(u / 2);
      const big = j === 3 && i % 15 === 0;
      pts.push({ x: f1(k * Math.cos(u)), y: f1(w * W * Math.sin(u / 2)), z: f1(k * Math.sin(u)), s: big ? 10 : 5, a: big, keep: big, d: f2((i / U) * 6) });
    }
  return pts;
});

const galaxy3d = form({ left: 400, top: 225, perspective: 900, tilt: 'rotateX(68deg)', bill: 'rotateX(-68deg)', period: 120, turn: '-360deg', pulse: 'fade', beat: 6 }, () => {
  const rnd = lcg(3);
  const pts: P3[] = [];
  for (let arm = 0; arm < 2; arm++)
    for (let i = 0; i < 230; i++) {
      const t = i * 0.045;
      const r = 12 * Math.exp(SPIRAL_B * t);
      if (r > 360) break;
      const spread = 0.12 + r / 900;
      const a = t + arm * Math.PI + (rnd() - 0.5) * spread * 2;
      const rr = r * (1 + (rnd() - 0.5) * spread);
      const thick = 40 * Math.exp(-r / 70) + 6;
      const big = i % 29 === 0;
      const s = big ? 10 : 3.6 + r / 120;
      pts.push({ x: f1(rr * Math.cos(a)), y: f1((rnd() - 0.5) * thick), z: f1(rr * Math.sin(a)), s: s.toFixed(1), a: big, keep: big, d: f2(-(r / 70)) });
    }
  pts.push({ x: '0', y: '0', z: '0', s: 14, a: true, keep: true, d: '0' });
  return pts;
});

/* -------------------------------------------------------------- registry */

/** Any scene: each entry pairs a builder with the renderer for its own data shape. */
interface AnyScene {
  kind: '2d' | '3d';
  build: (share: number) => unknown;
  render: (data: never, id: string) => ReactNode;
}

export const SCENES: Record<BackdropVariant, AnyScene> = {
  'constellation-atlas': constellation,
  orrery,
  'golden-angle': goldenAngle,
  'prime-lattice': primeLattice,
  'meridian-sweep': meridian,
  interference,
  'celestial-sphere': sphere,
  'fibonacci-sphere': fibonacciSphere,
  'star-torus': starTorus,
  'double-helix': doubleHelix,
  'wave-surface': waveSurface,
  'twin-vortex': vortex,
  'drifting-blooms': blooms,
  mobius,
  'galaxy-3d': galaxy3d,
};

/** Drawn marks in a scene's data: every placed item (it has an `x` or `x1`). */
export function countMarks(data: unknown): number {
  if (Array.isArray(data)) return data.reduce((n: number, y: unknown) => n + (y && typeof y === 'object' && ('x' in y || 'x1' in y) ? 1 : countMarks(y)), 0);
  if (data && typeof data === 'object') return Object.values(data).reduce((n: number, y: unknown) => n + countMarks(y), 0);
  return 0;
}

const cache = new Map<string, unknown>();

/**
 * The geometry of one variant at one density, thinned to the density's share
 * and capped at CAP[density] marks. Built once per process, then reused.
 */
export function sceneData(variant: BackdropVariant, density: BackdropDensity): unknown {
  const key = `${variant}|${density}`;
  let data = cache.get(key);
  if (data === undefined) {
    const scene = SCENES[variant];
    const share = Math.min(DENSITY[density], CAP[density] / Math.max(1, countMarks(scene.build(1))));
    data = scene.build(share);
    cache.set(key, data);
  }
  return data;
}

