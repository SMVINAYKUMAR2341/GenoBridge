'use client'
import { useId } from 'react'

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '')

/**
 * Server and browser trig results can differ in the last floating-point digit,
 * so every computed SVG number is rounded (and -0 normalised) before rendering
 * to keep hydration markup identical.
 */
const fx = (n: number, digits = 1) => String(Number(n.toFixed(digits)) + 0)

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
function mix(a: string, b: string, t: number) {
  const A = rgb(a),
    B = rgb(b)
  const k = Number(t.toFixed(3))
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`
}

/* Brand mark ------------------------------------------------------------ */

export function HelixLogo({ size = 46 }: { size?: number }) {
  const id = svgId(useId())
  const wave = (phase: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const t = i / 40
      return `${i ? 'L' : 'M'}${fx(4 + t * 40, 2)} ${fx(26 + 8 * Math.sin(t * 2 * Math.PI + phase), 2)}`
    }).join('')
  const rungs = [0.12, 0.21, 0.29, 0.38, 0.62, 0.71, 0.79, 0.88].map((t) => {
    const half = Math.abs(8 * Math.sin(t * 2 * Math.PI)) - 2
    return { x: 4 + t * 40, half }
  })
  return (
    <svg width={size} height={size * (52 / 48)} viewBox="0 0 48 52" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1fc75a" />
          <stop offset="1" stopColor="#8ff7b4" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4be282" />
          <stop offset="1" stopColor="#c4fbd6" />
        </linearGradient>
      </defs>
      <g transform="rotate(-58 24 26)">
        {rungs.map((r) => (
          <path
            key={r.x}
            d={`M${fx(r.x, 2)} ${fx(26 - r.half, 2)}V${fx(26 + r.half, 2)}`}
            stroke="#5ee992"
            strokeOpacity=".85"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        ))}
        <path
          d={wave(Math.PI)}
          stroke={`url(#${id}-b)`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={wave(0)}
          stroke={`url(#${id}-a)`}
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/* Shaded double helix ------------------------------------------------------ */

type Tone = 'emerald' | 'mint' | 'orchid'
const TONES: Record<
  Tone,
  { front: string; edge: string; back: string; rungEdge: string; rungCore: string; glow: string }
> = {
  emerald: {
    front: '#15a142',
    edge: '#6dd08a',
    back: '#dff5e6',
    rungEdge: '#93d8a9',
    rungCore: '#f2fdf5',
    glow: '#4ade80',
  },
  mint: {
    front: '#38bb5f',
    edge: '#90dba7',
    back: '#e4f7e9',
    rungEdge: '#a7e1b9',
    rungCore: '#f5fdf7',
    glow: '#86efac',
  },
  orchid: {
    front: '#c47bd6',
    edge: '#dfb1ea',
    back: '#f7e9fa',
    rungEdge: '#e4c2ec',
    rungCore: '#fdf7fe',
    glow: '#f0abfc',
  },
}

type HelixProps = {
  length: number
  radius: number
  period: number
  /** Axis position (in px) of a strand crossing. */
  crossAt?: number
  strand?: number
  rung?: number
  rungStep?: number
  tone?: Tone
  x?: number
  y?: number
  angle?: number
  fadeStart?: number
  fadeEnd?: number
  opacity?: number
}

/**
 * A right-handed double helix drawn along a horizontal axis, then placed with
 * `x`, `y` and `angle`. Strand segments facing the viewer are drawn above the
 * base pairs and shaded brighter; receding segments sit behind them and fade
 * toward the background, which gives a soft, glossy 3D read without filters.
 */
export function Helix3D({
  length,
  radius,
  period,
  crossAt = 0,
  strand = 10,
  rung = 6,
  rungStep = 26,
  tone = 'emerald',
  x = 0,
  y = 0,
  angle = 0,
  fadeStart = 0.2,
  fadeEnd = 0.15,
  opacity = 1,
}: HelixProps) {
  const id = svgId(useId())
  const c = TONES[tone]
  const k = (2 * Math.PI) / period
  const theta = (u: number, s: number) => k * (u - crossAt) + s * Math.PI
  const depth = (u: number, s: number) => -Math.cos(theta(u, s))
  const yAt = (u: number, s: number) => radius * Math.sin(theta(u, s))

  type Run = { s: number; front: boolean; u0: number; u1: number; d: string; hl: string }
  const runs: Run[] = []
  const step = Math.max(2, period / 90)
  const lift = strand * 0.22
  for (const s of [0, 1]) {
    let pts: [number, number][] = []
    let front = depth(0, s) >= 0
    let u0 = 0
    const flush = (u1: number) => {
      if (pts.length < 2) return
      const line = (dy: number) =>
        pts.map(([px, py], i) => `${i ? 'L' : 'M'}${fx(px)} ${fx(py + dy)}`).join('')
      runs.push({ s, front, u0, u1, d: line(0), hl: line(-lift) })
    }
    for (let u = 0; u <= length + 1e-6; u += step) {
      const p: [number, number] = [u, yAt(u, s)]
      const f = depth(u, s) >= 0
      if (f !== front) {
        pts.push(p)
        flush(u)
        pts = [p]
        front = f
        u0 = u
      } else pts.push(p)
    }
    flush(length)
  }

  const rungs: { u: number; h: number }[] = []
  for (let u = rungStep / 2; u < length; u += rungStep) {
    const span = Math.abs(yAt(u, 0)) * 2
    if (span > radius * 0.45) rungs.push({ u, h: Number((span - strand * 0.5).toFixed(2)) })
  }

  const pad = strand * 3
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
      <defs>
        <linearGradient
          id={`${id}-fade`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={length}
          y2="0"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={fadeStart} stopColor="#fff" />
          <stop offset={1 - fadeEnd} stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x={-pad}
          y={-radius - pad}
          width={length + pad * 2}
          height={radius * 2 + pad * 2}
        >
          <rect
            x={-pad}
            y={-radius - pad}
            width={length + pad * 2}
            height={radius * 2 + pad * 2}
            fill={`url(#${id}-fade)`}
          />
        </mask>
        <linearGradient id={`${id}-rung`} x1="0" x2="1">
          <stop offset="0" stopColor={c.rungEdge} />
          <stop offset=".42" stopColor={c.rungCore} />
          <stop offset="1" stopColor={c.rungEdge} />
        </linearGradient>
        {runs.map((r, i) => (
          <linearGradient
            key={i}
            id={`${id}-s${i}`}
            gradientUnits="userSpaceOnUse"
            x1={fx(r.u0, 2)}
            y1="0"
            x2={fx(Math.max(r.u1, r.u0 + 1), 2)}
            y2="0"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <stop
                key={t}
                offset={t}
                stopColor={mix(
                  c.edge,
                  r.front ? c.front : c.back,
                  Math.abs(depth(r.u0 + (r.u1 - r.u0) * t, r.s)),
                )}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g mask={`url(#${id}-mask)`} strokeLinecap="round" strokeLinejoin="round">
        {runs.map(
          (r, i) =>
            !r.front && (
              <g key={`b${i}`}>
                <path d={r.d} stroke={`url(#${id}-s${i})`} strokeWidth={strand * 0.88} />
                <path d={r.hl} stroke="#fff" strokeOpacity=".5" strokeWidth={strand * 0.2} />
              </g>
            ),
        )}
        {rungs.map((g) => (
          <g key={fx(g.u, 2)}>
            <rect
              x={fx(g.u - rung / 2, 2)}
              y={fx(-g.h / 2, 2)}
              width={rung}
              height={g.h}
              rx={rung / 2}
              fill={`url(#${id}-rung)`}
            />
            <rect
              x={fx(g.u - rung / 2 - 0.5, 2)}
              y={-1.3}
              width={rung + 1}
              height={2.6}
              rx={1.3}
              fill={c.rungEdge}
            />
          </g>
        ))}
        {runs.map(
          (r, i) =>
            r.front && (
              <g key={`f${i}`}>
                <path d={r.d} stroke={c.glow} strokeOpacity=".14" strokeWidth={strand * 2.4} />
                <path d={r.d} stroke={`url(#${id}-s${i})`} strokeWidth={strand} />
                <path d={r.hl} stroke="#fff" strokeOpacity=".62" strokeWidth={strand * 0.26} />
              </g>
            ),
        )}
      </g>
    </g>
  )
}

/* Dashboard hero backdrop -------------------------------------------------- */

export function HeroArt({ className = '' }: { className?: string }) {
  const id = svgId(useId())
  return (
    <svg
      aria-hidden
      viewBox="0 0 820 300"
      preserveAspectRatio="xMaxYMin meet"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id={`${id}-silk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".35" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".45" stopColor="#f4fff0" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-spark`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M0 190C140 130 300 165 440 140S690 50 820 62L820 135C690 125 560 185 430 196S140 210 0 250Z"
        fill={`url(#${id}-silk)`}
      />
      <path d="M0 190C140 130 300 165 440 140S690 50 820 62" stroke={`url(#${id}-edge)`} strokeWidth="1.4" />
      <path
        d="M150 300C300 248 450 262 590 214S760 150 820 146L820 300Z"
        fill={`url(#${id}-silk)`}
        opacity=".8"
      />
      <path d="M150 300C300 248 450 262 590 214S760 150 820 146" stroke={`url(#${id}-edge)`} strokeWidth="1.2" />
      <path d="M470 300C600 268 700 250 820 200" stroke={`url(#${id}-edge)`} strokeOpacity=".7" />
      <ellipse cx="470" cy="62" rx="150" ry="80" fill={`url(#${id}-light)`} />
      <g className="hx-float">
        <Helix3D
          length={720}
          radius={47}
          period={418}
          crossAt={264}
          strand={11}
          rung={7}
          rungStep={27}
          x={210}
          y={191}
          angle={-16.7}
          fadeStart={0.3}
          fadeEnd={0.1}
        />
      </g>
      {[
        [96, 104, 4],
        [318, 38, 3.2],
        [612, 236, 3.6],
        [742, 34, 3],
      ].map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy} r={r} fill={`url(#${id}-spark)`} />
      ))}
    </svg>
  )
}

/* Pathway card illustrations ----------------------------------------------- */

function CardHelix({
  tone,
  glow,
  angle,
  className,
}: {
  tone: Tone
  glow: string
  angle: number
  className: string
}) {
  const id = svgId(useId())
  return (
    <svg aria-hidden viewBox="0 0 168 168" className={className} fill="none">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={glow} stopOpacity=".35" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="112" cy="116" rx="72" ry="58" fill={`url(#${id}-glow)`} />
      <Helix3D
        length={260}
        radius={24}
        period={170}
        crossAt={118}
        strand={8}
        rung={5}
        rungStep={18}
        tone={tone}
        x={22}
        y={150}
        angle={angle}
        fadeStart={0.32}
        fadeEnd={0.02}
      />
    </svg>
  )
}

function MoleculeArt({ className }: { className: string }) {
  const id = svgId(useId())
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180
    return [Number(fx(54 + 16 * Math.cos(a), 2)), Number(fx(50 + 16 * Math.sin(a), 2))]
  })
  const atoms: [number, number, number, number][] = [
    [56, 10, 7.5, 0],
    [22, 28, 6.5, 5],
    [90, 24, 7, 1],
    [96, 64, 6.5, 2],
    [26, 82, 6, 4],
    [74, 88, 5.5, 3],
  ]
  return (
    <svg aria-hidden viewBox="0 0 110 100" className={className} fill="none" opacity=".78">
      <defs>
        <radialGradient id={`${id}-atom`} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#b8ebd5" />
          <stop offset="1" stopColor="#62c39b" />
        </radialGradient>
      </defs>
      <g stroke="#a6e0c6" strokeWidth="3" strokeLinecap="round">
        {atoms.map(([ax, ay, , v]) => (
          <line key={`${ax}-${ay}`} x1={hex[v][0]} y1={hex[v][1]} x2={ax} y2={ay} />
        ))}
      </g>
      <polygon
        points={hex.map((p) => p.join(',')).join(' ')}
        fill="#ecfaf3"
        stroke="#92d7b9"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <polygon
        points={hex.map(([px, py]) => `${fx(54 + (px - 54) * 0.55, 2)},${fx(50 + (py - 50) * 0.55, 2)}`).join(' ')}
        stroke="#c2ead7"
        strokeWidth="1.4"
      />
      {atoms.map(([ax, ay, r]) => (
        <circle key={`a${ax}`} cx={ax} cy={ay} r={r} fill={`url(#${id}-atom)`} />
      ))}
    </svg>
  )
}

function TreeArt({ className }: { className: string }) {
  const id = svgId(useId())
  const branches = [
    'M60 90C50 84 42 80 32 78',
    'M60 88C70 82 78 78 88 76',
    'M60 74C51 66 45 60 39 52',
    'M60 72C69 64 75 58 81 50',
    'M60 58C55 52 51 46 48 38',
    'M60 56C65 50 69 44 72 36',
    'M60 80V24',
  ]
  const leaves: [number, number, number][] = [
    [22, 74, -22],
    [98, 72, 22],
    [28, 48, -40],
    [92, 46, 40],
    [40, 30, -62],
    [80, 28, 62],
    [60, 16, -90],
    [47, 62, -18],
    [73, 60, 18],
  ]
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className} fill="none">
      <defs>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".62" r=".55">
          <stop offset="0" stopColor="#fdeebb" stopOpacity=".9" />
          <stop offset="1" stopColor="#fdeebb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-wood`} x1="0" x2="1">
          <stop offset="0" stopColor="#efd6a0" />
          <stop offset=".5" stopColor="#d9b06a" />
          <stop offset="1" stopColor="#eacd93" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b7e38d" />
          <stop offset="1" stopColor="#62b649" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="74" rx="58" ry="46" fill={`url(#${id}-glow)`} />
      <path d="M52 120C55 104 57 90 58 74H62C63 90 65 104 68 120Z" fill={`url(#${id}-wood)`} />
      <g stroke={`url(#${id}-wood)`} strokeLinecap="round">
        {branches.map((d, i) => (
          <path key={d} d={d} strokeWidth={i < 2 ? 3.4 : i < 4 ? 2.8 : 2.3} />
        ))}
      </g>
      {[
        [32, 78],
        [88, 76],
        [39, 52],
        [81, 50],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="3.6" fill="#fff8e6" stroke="#d9b36d" strokeWidth="1.6" />
      ))}
      {leaves.map(([lx, ly, rot]) => (
        <g key={`${lx}-${ly}`} transform={`translate(${lx} ${ly}) rotate(${rot})`}>
          <ellipse rx="8" ry="4.8" fill={`url(#${id}-leaf)`} />
          <path d="M-6 0H6" stroke="#fff" strokeOpacity=".45" strokeWidth=".9" />
        </g>
      ))}
    </svg>
  )
}

function MonitorArt({ className }: { className: string }) {
  const id = svgId(useId())
  return (
    <svg aria-hidden viewBox="0 0 92 86" className={className} fill="none">
      <defs>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#93c5fd" stopOpacity=".55" />
          <stop offset="1" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef4fc" />
          <stop offset="1" stopColor="#adc3e6" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b5aa4" />
          <stop offset="1" stopColor="#6596d8" />
        </linearGradient>
        <radialGradient id={`${id}-scan`} cx=".5" cy="0" r="1">
          <stop offset="0" stopColor="#e3eefc" />
          <stop offset="1" stopColor="#86ace2" />
        </radialGradient>
      </defs>
      <ellipse cx="46" cy="70" rx="46" ry="16" fill={`url(#${id}-glow)`} />
      <rect x="6" y="4" width="80" height="58" rx="7" fill={`url(#${id}-body)`} stroke="#a7bde2" />
      <rect x="11" y="9" width="70" height="48" rx="4" fill={`url(#${id}-screen)`} />
      <path d="M46 13L24 49A28 28 0 0 0 68 49Z" fill={`url(#${id}-scan)`} opacity=".88" />
      <g stroke="#fff" strokeLinecap="round">
        <path d="M33 39A16 16 0 0 0 59 39" strokeOpacity=".4" />
        <path d="M29 45A22 22 0 0 0 63 45" strokeOpacity=".28" />
      </g>
      <ellipse cx="41" cy="31" rx="5" ry="2.2" fill="#fff" fillOpacity=".38" />
      <ellipse cx="53" cy="35" rx="4" ry="1.8" fill="#fff" fillOpacity=".3" />
      <path d="M11 9H50L28 57H11Z" fill="#fff" fillOpacity=".07" />
      <path d="M40 62H52L54 72H38Z" fill="#a9bfe3" />
      <rect x="30" y="71" width="32" height="5" rx="2.5" fill="#b6c9e8" />
    </svg>
  )
}

function ClipboardArt({ className }: { className: string }) {
  const id = svgId(useId())
  return (
    <svg aria-hidden viewBox="0 0 64 80" className={className} fill="none">
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5fdf8" />
          <stop offset="1" stopColor="#dff5e8" />
        </linearGradient>
      </defs>
      <rect x="5" y="9" width="54" height="66" rx="8" fill={`url(#${id}-paper)`} stroke="#78cb9e" strokeWidth="2.6" />
      <rect x="20" y="3.5" width="24" height="11" rx="4" fill="#eefaf3" stroke="#78cb9e" strokeWidth="2.6" />
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
        <path d="M15 31l4.5 4.5 8-9" stroke="#5fbf8c" />
        <path d="M33 31.5h16" stroke="#8fd5af" />
        <path d="M15 49l4.5 4.5 8-9" stroke="#5fbf8c" />
        <path d="M33 49.5h16" stroke="#8fd5af" />
        <path d="M15 64h22" stroke="#bfe7d0" />
      </g>
    </svg>
  )
}

/** Decorative illustration for the pathway card at `index` (cycled every six). */
export function CardArt({ index }: { index: number }) {
  const base = 'pointer-events-none absolute'
  switch (index % 6) {
    case 0:
      return (
        <CardHelix
          tone="mint"
          glow="#4ade80"
          angle={-50}
          className={`${base} top-0 right-0 h-[168px] w-[168px]`}
        />
      )
    case 1:
      return <MoleculeArt className={`${base} top-[4px] right-[16px] h-[96px] w-[106px]`} />
    case 2:
      return (
        <CardHelix
          tone="orchid"
          glow="#e879f9"
          angle={-41}
          className={`${base} top-0 right-0 h-[160px] w-[160px] opacity-80`}
        />
      )
    case 3:
      return <TreeArt className={`${base} top-0 right-[8px] h-[120px] w-[120px]`} />
    case 4:
      return <MonitorArt className={`${base} top-[16px] right-[12px] h-[86px] w-[92px]`} />
    default:
      return <ClipboardArt className={`${base} top-[14px] right-[24px] h-[80px] w-[64px]`} />
  }
}

/* Sidebar card glow --------------------------------------------------------- */

export function SidebarWave({ className = '' }: { className?: string }) {
  const id = svgId(useId())
  const crest = 'M0 96C60 98 100 62 160 58C200 55 225 44 244 34'
  return (
    <svg aria-hidden viewBox="0 0 244 110" preserveAspectRatio="none" className={className} fill="none">
      <defs>
        <radialGradient id={`${id}-glow`} cx=".55" cy="1" r=".75">
          <stop offset="0" stopColor="#22c55e" stopOpacity=".5" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity=".42" />
          <stop offset="1" stopColor="#16a34a" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="0" x2="1">
          <stop offset="0" stopColor="#4ade80" stopOpacity="0" />
          <stop offset=".35" stopColor="#86efac" />
          <stop offset="1" stopColor="#bbf7d0" stopOpacity=".7" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="244" height="110" fill={`url(#${id}-glow)`} />
      <path d={`${crest}L244 110L0 110Z`} fill={`url(#${id}-fill)`} />
      <path d={crest} stroke={`url(#${id}-line)`} strokeWidth="5" filter={`url(#${id}-blur)`} />
      <path d={crest} stroke={`url(#${id}-line)`} strokeWidth="1.6" />
      <path
        d="M0 106C70 104 120 78 180 74C212 72 232 64 244 58"
        stroke="#4ade80"
        strokeOpacity=".35"
      />
    </svg>
  )
}
