/**
 * Draws the Home hero (visual-identity task 9.7): a client's shop as a
 * parts-catalog plate, with a drawing of each service coming out of it.
 *
 *   node scripts/storefront-art.mjs
 *
 * Writes src/assets/brand/storefront.svg and
 * src/components/hero/storefront-callouts.json (where each service's label
 * sits, as a % of the drawing, and how to crop the drawing on narrow
 * screens). The drawing is an isometric projection built from solids (a
 * profile pushed along an axis); each solid's faces are filled by class
 * (face, side, hl) and its contour is drawn with a heavier pen (sil) than
 * the folds and details inside it. Each service's group is named by its
 * service id, and anything wrapped in detail() only shows when the drawing
 * expands on hover. Other classes the hero colors with tokens: dash, course,
 * marks.
 */
import { writeFileSync } from 'node:fs'

const C = Math.cos(Math.PI / 6)
/** Moves the drawing so that its viewBox starts at 0 0 (the second pass). */
let shift = [0, 0]
const P = (x, y, z) => [(x - y) * C + shift[0], (x + y) / 2 - z + shift[1]]
const r = (n) => Math.round(n * 10) / 10 || 0
const xy = ([x, y]) => `${r(x)},${r(y)}`
const pts = (a) => a.map(xy).join(' ')

// The current group's markup, and the box it reaches.
let out = []
let reach = null
const grow = (a) => {
  for (const [x, y] of a) {
    reach ??= { x0: x, y0: y, x1: x, y1: y }
    reach.x0 = Math.min(reach.x0, x)
    reach.y0 = Math.min(reach.y0, y)
    reach.x1 = Math.max(reach.x1, x)
    reach.y1 = Math.max(reach.y1, y)
  }
}
const poly = (c, cls = 'face', extra = '') => {
  grow(c)
  out.push(`<polygon class="${cls}"${extra} points="${pts(c)}" />`)
}
const line = (a, b, cls = '') => {
  grow([a, b])
  out.push(
    `<line${cls ? ` class="${cls}"` : ''} x1="${r(a[0])}" y1="${r(a[1])}" x2="${r(b[0])}" y2="${r(b[1])}" />`
  )
}
const pline = (a) => {
  grow(a)
  out.push(`<polyline points="${pts(a)}" />`)
}

/** Chains segments that meet end to end, so the contour joins cleanly. */
function chain(segments) {
  const key = (p) => xy(p)
  const runs = segments.map((s) => [...s])
  for (let joined = true; joined;) {
    joined = false
    for (let i = 0; i < runs.length && !joined; i++)
      for (let j = 0; j < runs.length && !joined; j++) {
        if (i === j) continue
        const a = runs[i]
        const b = runs[j]
        const tail = key(a.at(-1))
        if (tail === key(b[0])) runs[i] = [...a, ...b.slice(1)]
        else if (tail === key(b.at(-1)))
          runs[i] = [...a, ...[...b].reverse().slice(1)]
        else continue
        runs.splice(j, 1)
        joined = true
      }
  }
  return runs
}

const V = [1, 1, 1] // toward the viewer
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

/**
 * A solid: a profile (points [s, t] in its own plane) pushed from depth d0
 * to d1; at(s, t, d) places a profile point in space. Draws the faces the
 * viewer sees, back to front, then over() for anything painted on them,
 * then the contour with the heavier pen. A seated solid rests on the part
 * below it, so its underside draws no contour; a part too small for the
 * heavier pen goes without (outline: false).
 */
function solid(profile, at, d0, d1, opts = {}) {
  const { over, outline = true, seated = false } = opts
  const area = profile.reduce((a, p, i) => {
    const q = profile[(i + 1) % profile.length]
    return a + p[0] * q[1] - q[0] * p[1]
  }, 0)
  const pr = area > 0 ? profile : [...profile].reverse()
  const n = pr.length
  const dir = (s, t, d) => sub(at(s, t, d), at(0, 0, 0))
  const axis = dir(0, 0, 1)
  const toward = dot(axis, V) > 0
  const near = toward ? d1 : d0
  const far = toward ? d0 : d1
  const Q = (p, d) => P(...at(p[0], p[1], d))
  const shade = (v) => (v[0] / Math.hypot(...v) > 0.7 ? 'face side' : 'face')
  const faces = pr.map((p, i) => {
    const q = pr[(i + 1) % n]
    const normal = dir(q[1] - p[1], p[0] - q[0], 0)
    const depth = dot(at((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, near), V)
    return { p, q, normal, depth, seen: dot(normal, V) > 1e-9 }
  })
  faces
    .filter((f) => f.seen)
    .sort((a, b) => a.depth - b.depth)
    .forEach((f) =>
      poly(
        [Q(f.p, far), Q(f.q, far), Q(f.q, near), Q(f.p, near)],
        shade(f.normal)
      )
    )
  poly(
    pr.map((p) => Q(p, near)),
    shade(toward ? axis : sub([0, 0, 0], axis))
  )
  over?.()
  if (!outline) return
  const underside = (f) =>
    seated && f.normal[2] < 0 && !f.normal[0] && !f.normal[1]
  const segments = []
  for (const f of faces)
    if (!underside(f))
      segments.push(
        f.seen ? [Q(f.p, far), Q(f.q, far)] : [Q(f.p, near), Q(f.q, near)]
      )
  faces.forEach((f, i) => {
    const prev = faces[(i + n - 1) % n]
    if (f.seen !== prev.seen && !underside(f) && !underside(prev))
      segments.push([Q(f.p, d0), Q(f.p, d1)])
  })
  const runs = chain(segments)
  runs.forEach(grow)
  out.push(
    `<path class="sil" stroke-width="1.6" d="${runs.map((run) => 'M' + run.map(xy).join('L')).join('')}" />`
  )
}
const box = (x0, y0, z0, w, d, h, opts) =>
  solid(
    [
      [x0, z0],
      [x0 + w, z0],
      [x0 + w, z0 + h],
      [x0, z0 + h]
    ],
    (s, t, dd) => [s, dd, t],
    y0,
    y0 + d,
    opts
  )
/** An upright panel facing the viewer; returns a mapper for its front face. */
function panel(x0, y, z0, w, h, t = 4) {
  box(x0, y - t, z0, w, t, h)
  return (u, v) => P(x0 + u, y, z0 + v)
}

// Flat shapes drawn in a plane, through a mapper F(u, v).
const rectF = (F, u0, v0, u1, v1, cls = 'face') =>
  poly([F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)], cls)
const lineF = (F, u0, v0, u1, v1) => line(F(u0, v0), F(u1, v1))
const arcF = (F, u, v, rad, a0 = 0, a1 = 2 * Math.PI) => {
  const steps = Math.max(12, Math.round(rad * 7))
  const full = Math.abs(a1 - a0 - 2 * Math.PI) < 1e-9
  return Array.from({ length: full ? steps : steps + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / steps
    return F(u + rad * Math.cos(a), v + rad * Math.sin(a))
  })
}
const circleF = (F, u, v, rad, cls = 'face') => poly(arcF(F, u, v, rad), cls)
/** Paints over the lines below it without drawing an edge of its own. */
const knockF = (F, u0, v0, u1, v1) =>
  poly([F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)], 'face', ' stroke="none"')

/** A speech bubble with its tail at one of its bottom corners. */
function bubble(F, u0, v0, u1, v1, tail) {
  const t =
    tail === 'right'
      ? [F(u1, v0), F(u1 + 1.5, v0 - 4), F(u1 - 5, v0)]
      : [F(u0 + 5, v0), F(u0 - 1.5, v0 - 4), F(u0, v0)]
  poly(
    tail === 'right'
      ? [F(u0, v1), F(u1, v1), ...t, F(u0, v0)]
      : [F(u0, v1), F(u1, v1), F(u1, v0), ...t]
  )
}
/** A page with a folded corner and three lines of text. */
function page(F, u0, v0, u1, v1) {
  const f = 2.5
  poly([F(u0, v0), F(u1, v0), F(u1, v1 - f), F(u1 - f, v1), F(u0, v1)])
  pline([F(u1 - f, v1), F(u1 - f, v1 - f), F(u1, v1 - f)])
  for (const v of [v1 - 4.5, v1 - 7, v1 - 9.5])
    lineF(F, u0 + 1.5, v, u1 - 1.5, v)
}
/** A map pin whose point touches (u, v). */
function pin(F, u, v) {
  const rad = 3.2
  const d = 7
  const t = Math.acos(rad / d)
  poly([
    F(u, v),
    ...arcF(F, u, v + d, rad, -Math.PI / 2 + t, (3 * Math.PI) / 2 - t)
  ])
  circleF(F, u, v + d, 1.2)
}
/** A pencil lying along u, from its point at u0 to its eraser at u1. */
function pencil(F, u0, v, u1, w) {
  const h = w / 2
  poly([
    F(u0, v),
    F(u0 + 4, v - h),
    F(u1, v - h),
    F(u1, v + h),
    F(u0 + 4, v + h)
  ])
  lineF(F, u0 + 4, v - h, u0 + 4, v + h)
  lineF(F, u0 + 1.4, v - 0.5, u0 + 1.4, v + 0.5)
  lineF(F, u1 - 3, v - h, u1 - 3, v + h)
}
/** A combination wrench lying along u: open end at u0, ring end at u1. */
function wrench(F, u0, u1, w) {
  const open = 3
  const ring = 2.5
  const h = 1
  const slot = 1.1
  circleF(F, u0, w, open)
  circleF(F, u1, w, ring)
  // The shank is painted over both heads, so the outline stays one piece.
  knockF(F, u0, w - h, u1 - 1.6, w + h)
  const a = u0 + Math.sqrt(open ** 2 - h ** 2)
  const b = u1 - Math.sqrt(ring ** 2 - h ** 2)
  lineF(F, a, w - h, b, w - h)
  lineF(F, a, w + h, b, w + h)
  circleF(F, u1, w, 1.2)
  // The jaw, open toward the end.
  const edge = u0 - Math.sqrt(open ** 2 - slot ** 2)
  knockF(F, u0 - open - 0.5, w - slot, u0 + 0.6, w + slot)
  pline([
    F(edge, w - slot),
    F(u0 + 0.6, w - slot),
    F(u0 + 0.6, w + slot),
    F(edge, w + slot)
  ])
}

const W = 120
const D = 70
const H = 60
const SCALE = 1.35 // how far a service expands, about its leader's ring
/** Each service's turn when they come out on load: clockwise from the top. */
const TURN = {
  websites: 0,
  'tech-checkup': 1,
  'care-and-rescue': 2,
  integrations: 3,
  'custom-web-apps': 4,
  'ai-features': 5
}
/** The labels' order in the page, which is also their tab order. */
const LABEL_ORDER = [
  'tech-checkup',
  'ai-features',
  'websites',
  'care-and-rescue',
  'integrations',
  'custom-web-apps'
]

/** Draws everything once, at the current shift. */
function drawAll() {
  const groups = []
  const detail = (draw) => {
    out.push('<g class="detail">')
    draw()
    out.push('</g>')
  }
  const group = (name, draw) => {
    out = []
    reach = null
    const anchor = draw(detail)
    groups.push({ name, body: out.join(''), reach, anchor })
  }

  group('shop', () => {
    // The client's business: a one-story brick shop on its sidewalk, with a
    // stepped false front carrying its sign.
    box(-12, -12, -8, W + 24, D + 24, 8, {
      over: () => {
        for (const x of [24, 60, 96])
          line(P(x, D, 0), P(x, D + 12, 0), 'course')
        for (const y of [10, 46]) line(P(W, y, 0), P(W + 12, y, 0), 'course')
      }
    })
    box(0, 0, 0, W, D, H, {
      over: () => {
        for (let z = 7.5; z < H; z += 7.5)
          line(P(W, 0, z), P(W, D, z), 'course')
      }
    })
    solid(
      [
        [0, H],
        [W, H],
        [W, H + 11],
        [92, H + 11],
        [92, H + 16],
        [28, H + 16],
        [28, H + 11],
        [0, H + 11]
      ],
      (s, t, d) => [s, d, t],
      D - 4,
      D,
      { seated: true }
    )
    box(33, D, H + 2.5, 54, 1.5, 11)
    const Sign = (u, v) => P(33 + u, D + 1.5, H + 2.5 + v)
    lineF(Sign, 12, 6.5, 42, 6.5)
    lineF(Sign, 18, 3.5, 36, 3.5)

    const F = (u, v) => P(u, D, v)
    // The display window, with a glint on its glass, and its sill.
    rectF(F, 10, 8, 66, 46)
    lineF(F, 38, 8, 38, 46)
    lineF(F, 14, 12, 21, 21)
    lineF(F, 18.5, 12, 22, 16.5)
    box(8, D, 6, 60, 3, 2, { outline: false })
    // The door: a glass panel, a transom and a knob.
    rectF(F, 80, 0, 104, 46)
    lineF(F, 80, 38, 104, 38)
    rectF(F, 84, 16, 96, 33)
    lineF(F, 86.5, 20, 90.5, 26)
    circleF(F, 100, 21, 1.2)
    // A striped awning over the window.
    solid(
      [
        [D, 54],
        [D + 13, 45],
        [D + 13, 41],
        [D + 12, 41],
        [D + 12, 44.7],
        [D, 53]
      ],
      (s, t, d) => [d, s, t],
      7,
      69,
      {
        over: () => {
          for (let k = 1; k < 8; k += 2) {
            const a = 7 + k * 7.75
            const b = a + 7.75
            poly(
              [P(a, D, 54), P(b, D, 54), P(b, D + 13, 45), P(a, D + 13, 45)],
              'face side'
            )
            poly(
              [
                P(a, D + 13, 45),
                P(b, D + 13, 45),
                P(b, D + 13, 41),
                P(a, D + 13, 41)
              ],
              'face side'
            )
          }
        }
      }
    )
    return null
  })

  // The services, each anchored where its leader meets its outline.
  group('tech-checkup', (detail) => {
    // A clipboard with a checklist, by the roof.
    const F = panel(150, 10, 92, 34, 44)
    rectF(F, 3, 3, 31, 39)
    box(161, 10, 132, 12, 2.5, 7, { outline: false })
    ;[29, 19, 9].forEach((v, i) => {
      rectF(F, 6, v, 12, v + 6)
      lineF(F, 15, v + 3, 28, v + 3)
      const tick = () => pline([F(7.2, v + 3.2), F(8.8, v + 1.4), F(11, v + 5)])
      if (i < 2) tick()
      else detail(tick)
    })
    detail(() => pencil(F, 8, 5.5, 30, 2.8))
    return { at: P(184, 6, 114), side: 'right' }
  })
  group('ai-features', (detail) => {
    // A chat window: a customer's question, and the answer.
    const F = panel(-118, 40, 70, 64, 46)
    lineF(F, 0, 40, 64, 40)
    circleF(F, 5, 43, 1.5)
    lineF(F, 9, 43, 26, 43)
    bubble(F, 30, 28.5, 58, 36, 'right')
    lineF(F, 34, 32.25, 54, 32.25)
    bubble(F, 6, 6.5, 44, 19.5, 'left')
    lineF(F, 10, 16, 40, 16)
    lineF(F, 10, 12.75, 34, 12.75)
    detail(() => {
      // The answer runs on, drawn from the business's own page.
      lineF(F, 10, 9.5, 37, 9.5)
      page(F, 49, 4.5, 57, 16.5)
    })
    return { at: F(0, 23), side: 'left' }
  })
  group('websites', (detail) => {
    // A browser window, with this business found first.
    const F = panel(4, 40, 108, 112, 68)
    lineF(F, 0, 57, 112, 57)
    for (const u of [5, 9.5, 14]) circleF(F, u, 62.5, 1.4)
    rectF(F, 20, 59.5, 104, 65.5)
    circleF(F, 98.5, 63, 1.5)
    lineF(F, 99.6, 61.9, 101.2, 60.3)
    for (let i = 0; i < 3; i++) {
      const v = 43 - i * 15
      rectF(F, 8, v, 60, v + 7, i === 0 ? 'hl' : 'face')
      lineF(F, 8, v - 3.5, 98, v - 3.5)
      lineF(F, 8, v - 6.5, 80, v - 6.5)
    }
    detail(() => {
      // Found on the map, too.
      rectF(F, 70, 6, 106, 51)
      lineF(F, 70, 21, 106, 21)
      lineF(F, 83, 6, 83, 51)
      lineF(F, 70, 44, 106, 31)
      pin(F, 95, 26)
    })
    return { at: P(116, 36, 154), side: 'right' }
  })
  group('care-and-rescue', (detail) => {
    // A toolbox, by the foundation.
    box(150, 40, -8, 40, 20, 11)
    box(150, 40, 3, 40, 20, 5, { seated: true })
    box(156, 60, 0, 4, 1, 6, { outline: false })
    box(180, 60, 0, 4, 1, 6, { outline: false })
    box(157, 49, 8, 2, 2, 5, { outline: false })
    box(181, 49, 8, 2, 2, 5, { outline: false })
    box(156, 49, 13, 28, 2, 2.5)
    // A wrench on the lid, ready.
    detail(() => wrench((u, w) => P(150 + u, 40 + w, 8), 7, 31, 15.5))
    return { at: P(190, 40, 0), side: 'right' }
  })
  group('integrations', (detail) => {
    // A card terminal and a booking calendar, by the door.
    box(66, 128, -8, 22, 12, 28)
    const T = (u, v) => P(66 + u, 140, -8 + v)
    rectF(T, 3, 18, 19, 25)
    for (let c = 0; c < 3; c++)
      for (let rr = 0; rr < 2; rr++)
        rectF(T, 4 + c * 5, 5 + rr * 5, 7 + c * 5, 8 + rr * 5)
    line(P(70, 134, 20), P(84, 134, 20))
    detail(() => box(71, 133, 20, 12, 1.5, 10))
    const F = panel(118, 146, 10, 40, 38)
    rectF(F, 0, 30, 40, 38)
    lineF(F, 15, 34, 25, 34)
    for (const u of [9, 31]) rectF(F, u - 0.9, 35.5, u + 0.9, 41)
    for (let c = 0; c < 4; c++)
      for (let rr = 0; rr < 3; rr++)
        rectF(
          F,
          3 + c * 9,
          3 + rr * 9,
          10 + c * 9,
          9 + rr * 9,
          c === 2 && rr === 1 ? 'face side' : 'face'
        )
    detail(() => pline([F(22.6, 15), F(24.3, 13.4), F(26.8, 16.8)]))
    return { at: T(0, 14), side: 'left' }
  })
  group('custom-web-apps', (detail) => {
    // A phone running the business's app: two orders and a button.
    const F = panel(-34, 116, 6, 30, 52)
    rectF(F, 2.5, 6, 27.5, 46)
    lineF(F, 12, 49, 18, 49)
    lineF(F, 12, 3, 18, 3)
    rectF(F, 2.5, 39, 27.5, 46)
    lineF(F, 6, 42.5, 16, 42.5)
    for (const v of [29, 19]) {
      rectF(F, 5.5, v, 24.5, v + 7)
      rectF(F, 7.5, v + 1.5, 11.5, v + 5.5)
    }
    rectF(F, 5.5, 8.5, 24.5, 14)
    detail(() => {
      for (const v of [29, 19]) {
        lineF(F, 13.5, v + 4.5, 22, v + 4.5)
        lineF(F, 13.5, v + 2.5, 19, v + 2.5)
      }
      pline([F(12.6, 11.3), F(14.2, 9.9), F(17.4, 12.8)])
    })
    return { at: F(0, 26), side: 'left' }
  })

  // Dashed lines from each service back to where it plugs into the shop.
  out = []
  reach = null
  const dashes = {
    websites: [
      [P(10, 40, 108), P(10, 40, H)],
      [P(110, 40, 108), P(110, 40, H)]
    ],
    'tech-checkup': [[P(150, 10, 92), P(W, 10, H)]],
    'ai-features': [[P(-54, 40, 70), P(0, D, H + 6)]],
    'custom-web-apps': [[P(-4, 114, 30), P(10, D, 20)]],
    integrations: [
      [P(77, 128, 20), P(84, D, 0)],
      [P(127, 144, 48), P(104, D, 4)]
    ],
    'care-and-rescue': [[P(150, 50, 0), P(W, 50, 0)]]
  }
  const assembly = Object.entries(dashes).map(([name, segs]) => {
    out = []
    for (const [a, b] of segs) line(a, b)
    return `<g class="dash a-${name}" style="--i: ${TURN[name]}">${out.join('')}</g>`
  })
  return { groups, assembly: assembly.join(''), assemblyReach: reach }
}

// First pass: find the drawing's extent, then lay out the plate round it.
const union = (boxes) => ({
  x0: Math.min(...boxes.map((b) => b.x0)),
  y0: Math.min(...boxes.map((b) => b.y0)),
  x1: Math.max(...boxes.map((b) => b.x1)),
  y1: Math.max(...boxes.map((b) => b.y1))
})
const scaled = (b, [ox, oy]) => ({
  x0: ox + (b.x0 - ox) * SCALE,
  y0: oy + (b.y0 - oy) * SCALE,
  x1: ox + (b.x1 - ox) * SCALE,
  y1: oy + (b.y1 - oy) * SCALE
})
const first = drawAll()
const art = union([...first.groups.map((g) => g.reach), first.assemblyReach])
const artW = art.x1 - art.x0
const artH = art.y1 - art.y0
const expanded = union(
  first.groups.filter((g) => g.anchor).map((g) => scaled(g.reach, g.anchor.at))
)

const LEAD = 16 // from the drawing's edge to its labels' column
const LABEL = 130 // room for a label
const MARK = 8 // the crop marks' band round the plate
const PAD = 14 // above and below the drawing, inside the crop marks
// src/lib/og.ts crops 24% off each side for the social images (ART_GUTTER),
// so the gutters are never narrower than that share of the plate.
const OG_GUTTER = 0.24
const gutter = Math.max(
  LEAD + LABEL + MARK,
  (OG_GUTTER / (1 - 2 * OG_GUTTER)) * artW
)
const vb = {
  x: art.x0 - gutter,
  y: art.y0 - PAD - MARK,
  w: artW + 2 * gutter,
  h: artH + 2 * (PAD + MARK)
}

// Second pass: the same drawing, moved so the viewBox starts at 0 0.
shift = [-vb.x, -vb.y]
const { groups, assembly } = drawAll()
const move = ([x, y]) => [x - vb.x, y - vb.y]
const left = art.x0 - LEAD - vb.x
const right = art.x1 + LEAD - vb.x
const shopCenter = (() => {
  const s = groups.find((g) => g.name === 'shop').reach
  return [(s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2]
})()

const ringR = 3.5
const callouts = groups
  .filter((g) => g.anchor)
  .map((g) => {
    const [ax, ay] = g.anchor.at
    const l = g.anchor.side === 'left'
    const lx = l ? left : right
    return `<g class="callout c-${g.name} ${g.anchor.side}" style="--i: ${TURN[g.name]}"><line class="leader" x1="${r(ax + (l ? -ringR : ringR))}" y1="${r(ay)}" x2="${r(lx)}" y2="${r(ay)}" /><circle class="ring face" cx="${r(ax)}" cy="${r(ay)}" r="${ringR}" /><circle class="pip" fill="currentColor" stroke="none" cx="${r(ax)}" cy="${r(ay)}" r="1.8" /><circle class="end" fill="currentColor" cx="${r(lx)}" cy="${r(ay)}" r="1.4" /></g>`
  })
  .join('')

// Printer's crop marks at the plate's corners, outside its trim.
const marks = [
  [MARK, MARK, -1, -1],
  [vb.w - MARK, MARK, 1, -1],
  [MARK, vb.h - MARK, -1, 1],
  [vb.w - MARK, vb.h - MARK, 1, 1]
]
  .map(([x, y, sx, sy]) => {
    const gap = 3
    out = []
    line([x + sx * gap, y], [x + sx * MARK, y])
    line([x, y + sy * gap], [x, y + sy * MARK])
    return out.join('')
  })
  .join('')

const groupMarkup = (g) => {
  if (g.name === 'shop') return `<g class="shop">${g.body}</g>`
  const c = [(g.reach.x0 + g.reach.x1) / 2, (g.reach.y0 + g.reach.y1) / 2]
  const from = [0, 1].map((k) => `${r((shopCenter[k] - c[k]) * 0.5)}px`)
  const at = g.anchor.at.map((n) => `${r(n)}px`)
  return `<g class="service s-${g.name}" style="--at: ${at.join(' ')}; --from: ${from.join(' ')}; --i: ${TURN[g.name]}">${g.body}</g>`
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(vb.w)} ${r(vb.h)}">
  <!-- Hero concept "Storefront, exploded": a client's shop with a drawing of each service coming out of it, drawn like a parts-catalog plate. Generated by scripts/storefront-art.mjs; faces are styled by class. -->
  <g fill="none" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round">
    <g class="marks">${marks}</g>
    ${groupMarkup(groups[0])}
    <g class="assembly">${assembly}</g>
    ${groups.slice(1).map(groupMarkup).join('\n    ')}
    <g class="callouts">${callouts}</g>
  </g>
</svg>
`
writeFileSync('src/assets/brand/storefront.svg', svg)

const pct = (n, of) => r((n / of) * 100)
const labels = LABEL_ORDER.map((name) => {
  const g = groups.find((g) => g.name === name)
  const l = g.anchor.side === 'left'
  const x = l ? left : right
  return {
    part: name,
    side: g.anchor.side,
    x: pct(x, vb.w),
    y: pct(g.anchor.at[1], vb.h),
    w: pct(l ? x - MARK : vb.w - MARK - x, vb.w),
    i: TURN[name]
  }
})
// On narrow screens the labels are hidden and the plate is cropped to the
// drawing, with a small margin; margins in % resolve against the width.
const m = 6
const cropW = artW + 2 * m
const [cx0, cy0] = move([art.x0 - m, art.y0 - m])
const [, cy1] = move([0, art.y1 + m])
const crop = {
  w: pct(vb.w, cropW),
  x: -pct(cx0, cropW),
  y: -pct(cy0, cropW),
  b: -pct(vb.h - cy1, cropW)
}
writeFileSync(
  'src/components/hero/storefront-callouts.json',
  JSON.stringify({ crop, labels }, null, 2) + '\n'
)
console.log('viewBox', `0 0 ${r(vb.w)} ${r(vb.h)}`)
console.log('gutter share', r((gutter / vb.w) * 100) / 100)
console.log(
  'expanded parts reach past the plate by',
  JSON.stringify({
    top: r(vb.y - expanded.y0),
    bottom: r(expanded.y1 - (vb.y + vb.h)),
    left: r(vb.x - expanded.x0),
    right: r(expanded.x1 - (vb.x + vb.w))
  })
)
console.log(JSON.stringify({ crop, labels }))
