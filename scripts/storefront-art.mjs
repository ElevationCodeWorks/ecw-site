/**
 * Draws the Home hero (visual-identity task 9.7): a client's shop as a
 * parts-catalog plate, with a drawing of each service coming out of it.
 *
 *   node scripts/storefront-art.mjs
 *
 * Writes src/assets/brand/storefront.svg and
 * src/components/hero/storefront-callouts.json (where each service's label
 * sits, as a % of the drawing). The drawing is an isometric projection built
 * from boxes and upright panels; each service's group is named by its
 * service id, and anything wrapped in detail() only shows when the drawing
 * expands on hover. Faces carry classes (face, side, hl, dash, course) that
 * the hero component colors with tokens.
 */
import { writeFileSync } from 'node:fs'
const C = Math.cos(Math.PI / 6),
  S = 0.5
const P = (x, y, z) => [(x - y) * C, (x + y) * S - z]
const r = (n) => Math.round(n * 10) / 10
const pts = (a) => a.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')
let out = []
const poly = (c, cls = 'face') =>
  out.push(
    `<polygon class="${cls}" fill="currentColor" stroke="currentColor" points="${pts(c)}" />`
  )
const line = (a, b, cls = '') =>
  out.push(
    `<line${cls ? ` class="${cls}"` : ''} x1="${r(a[0])}" y1="${r(a[1])}" x2="${r(b[0])}" y2="${r(b[1])}" stroke="currentColor" />`
  )
const pline = (a) =>
  out.push(`<polyline fill="none" stroke="currentColor" points="${pts(a)}" />`)
function box(x0, y0, z0, w, d, h, front = 'face') {
  const [x1, y1, z1] = [x0 + w, y0 + d, z0 + h]
  poly(
    [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)],
    'face side'
  )
  poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], front)
  poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], 'face')
}
/** An upright panel facing the viewer; returns a mapper for its front face. */
function panel(x0, y, z0, w, h, t = 4) {
  box(x0, y - t, z0, w, t, h)
  return (u, v) => P(x0 + u, y, z0 + v)
}
const rectF = (F, u0, v0, u1, v1, cls = 'face') =>
  poly([F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)], cls)
const lineF = (F, u0, v0, u1, v1) => line(F(u0, v0), F(u1, v1))
const circleF = (F, u, v, rad, cls = 'face') =>
  poly(
    Array.from({ length: 20 }, (_, i) =>
      F(
        u + rad * Math.cos((i / 20) * 2 * Math.PI),
        v + rad * Math.sin((i / 20) * 2 * Math.PI)
      )
    ),
    cls
  )

const groups = []
/** Draws details that only show when the object expands. */
const detail = (draw) => {
  out.push('<g class="detail">')
  draw()
  out.push('</g>')
}
const center = (pts) => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length
]
function group(name, draw) {
  out = []
  const anchor = draw()
  groups.push({ name, body: out.join(''), anchor })
}
const W = 120,
  D = 70,
  H = 60
const shopCenter = P(W / 2, D / 2, H / 2)

// The services, back to front.
group('tech-checkup', () => {
  // a clipboard with a checklist, by the roof
  const F = panel(150, 10, 92, 34, 44)
  rectF(F, 12, 40, 22, 47)
  for (let i = 0; i < 3; i++) {
    const v = 30 - i * 10
    rectF(F, 5, v, 11, v + 6)
    if (i < 2) pline([F(6.2, v + 3.2), F(7.8, v + 1.4), F(10, v + 5)])
    lineF(F, 14, v + 3, 29, v + 3)
  }
  detail(() => {
    pline([F(6.2, 13.2), F(7.8, 11.4), F(10, 15)])
    poly([F(22, 2), F(38, 14), F(36.5, 16), F(20.5, 4)])
    pline([F(22, 2), F(19, 0.5), F(20.5, 4)])
  })
  return { at: F(34, 22), side: 'right' }
})
group('ai-features', () => {
  // a chat window: a question and an answer
  const F = panel(-118, 40, 70, 64, 46)
  poly([F(6, 28), F(40, 28), F(40, 40), F(6, 40)])
  pline([F(10, 28), F(8, 23), F(16, 28)])
  lineF(F, 10, 34, 34, 34)
  poly([F(22, 8), F(58, 8), F(58, 21), F(22, 21)])
  pline([F(52, 8), F(56, 3), F(48, 8)])
  lineF(F, 26, 16, 54, 16)
  lineF(F, 26, 12, 46, 12)
  detail(() => {
    lineF(F, 26, 19, 50, 19)
    poly([F(6, 1), F(22, 1), F(22, 6), F(6, 6)])
    for (const u of [10, 14, 18]) circleF(F, u, 3.5, 0.8)
  })
  return { at: F(0, 23), side: 'left' }
})
group('websites', () => {
  // a browser window with this business found first
  const F = panel(4, 50, 108, 112, 68)
  lineF(F, 0, 56, 112, 56)
  rectF(F, 8, 59, 84, 65)
  circleF(F, 79, 62, 1.8)
  for (let i = 0; i < 3; i++) {
    const v = 42 - i * 14
    rectF(F, 8, v, 64, v + 7, i === 0 ? 'hl' : 'face')
    lineF(F, 8, v - 4, 96, v - 4)
  }
  detail(() => {
    rectF(F, 72, 12, 106, 50)
    for (const v of [24, 37]) lineF(F, 72, v, 106, v)
    for (const u of [84, 95]) lineF(F, u, 12, u, 50)
    circleF(F, 89, 35, 3)
    pline([F(86.4, 33.5), F(89, 27), F(91.6, 33.5)])
  })
  return { at: F(112, 46), side: 'right' }
})
group('shop', () => {
  // the client's business: a one-story brick shop
  box(-12, -12, -8, W + 24, D + 24, 8)
  box(0, 0, 0, W, D, H)
  box(40, D - 8, H, 40, 8, 9)
  box(6, D - 2, 62, 108, 4, 13, 'face sign')
  const F = (u, v) => P(u, D, v)
  rectF(F, 10, 8, 66, 46, 'face')
  lineF(F, 38, 8, 38, 46)
  rectF(F, 80, 0, 104, 46, 'face')
  lineF(F, 80, 38, 104, 38)
  circleF(F, 100, 21, 1.2)
  box(8, D, 6, 60, 3, 2)
  // A striped awning over the display window.
  poly([P(7, D, 54), P(69, D, 54), P(69, D + 13, 45), P(7, D + 13, 45)])
  for (let x = 7; x <= 69; x += 7.75) line(P(x, D, 54), P(x, D + 13, 45))
  poly([
    P(7, D + 13, 45),
    P(69, D + 13, 45),
    P(69, D + 13, 41),
    P(7, D + 13, 41)
  ])
  poly([P(69, D, 54), P(69, D + 13, 45), P(69, D + 13, 41)], 'face side')
  for (const z of [12, 24, 36, 48]) line(P(W, 0, z), P(W, D, z), 'course')
  return null
})
group('care-and-rescue', () => {
  // a toolbox, by the foundation
  box(150, 40, -8, 40, 20, 16)
  const top = (x) => P(x, 50, 8)
  pline([top(158), P(158, 50, 16), P(182, 50, 16), top(182)])
  // A latch on the front.
  const Fr = (u, v) => P(150 + u, 60, -8 + v)
  rectF(Fr, 17, 9, 23, 13)
  detail(() => {
    line(P(162, 48, 8), P(164, 48, 24))
    circleF((u, v) => P(164 + u, 48, 24 + v), 0, 2, 2)
    line(P(176, 52, 8), P(178, 52, 20))
    line(P(178, 52, 20), P(178.6, 52, 23))
  })

  return { at: P(190, 50, 0), side: 'right' }
})
group('integrations', () => {
  // a booking calendar and a card terminal, by the door
  const F = panel(118, 146, 10, 40, 38)
  rectF(F, 0, 30, 40, 38)
  for (let c = 0; c < 4; c++)
    for (let rr = 0; rr < 3; rr++)
      rectF(
        F,
        3 + c * 9,
        3 + rr * 9,
        10 + c * 9,
        9 + rr * 9,
        c === 2 && rr === 1 ? 'face booked' : 'face'
      )
  detail(() => pline([F(22.5, 14), F(24.5, 12), F(27, 17)]))
  box(66, 128, -8, 22, 12, 28)
  const T = (u, v) => P(66 + u, 140, -8 + v)
  rectF(T, 3, 18, 19, 25)
  for (let c = 0; c < 3; c++)
    for (let rr = 0; rr < 2; rr++)
      rectF(T, 4 + c * 5, 5 + rr * 5, 7 + c * 5, 8 + rr * 5)
  detail(() => box(71, 133, 20, 12, 1.5, 10))
  return { at: T(0, 14), side: 'left' }
})
group('custom-web-apps', () => {
  // a phone running the business's app
  const F = panel(-34, 116, 6, 30, 52)
  rectF(F, 3, 5, 27, 46)
  lineF(F, 12, 49, 18, 49)
  rectF(F, 3, 40, 27, 46)
  rectF(F, 6, 29, 24, 36)
  rectF(F, 6, 19, 24, 26)
  rectF(F, 6, 9, 24, 14)
  detail(() => {
    for (const v of [31, 21]) {
      lineF(F, 9, v + 2, 21, v + 2)
      lineF(F, 9, v, 17, v)
    }
    pline([F(12, 11.5), F(14, 10), F(18, 13)])
  })
  return { at: F(0, 26), side: 'left' }
})

// Dashed lines from each service back to where it plugs into the shop.
out = []
const dash = (a, b) => line(a, b, 'dash')
dash(P(10, 50, 108), P(10, D, 75))
dash(P(110, 50, 108), P(110, D, 75))
dash(P(-54, 40, 70), P(10, D, 46))
dash(P(-4, 116, 30), P(10, D, 30))
dash(P(118, 146, 24), P(104, D, 24))
dash(P(77, 128, 20), P(84, D, 0))
dash(P(150, 40, 0), P(W, 40, 0))
dash(P(150, 10, 92), P(W, 10, H))
const assembly = out.join('')

let minX = Infinity,
  maxX = -Infinity,
  minY = Infinity,
  maxY = -Infinity
for (const g of groups)
  for (const m of g.body.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
    const x = +m[1],
      y = +m[2]
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
// Leaders: a ring on the service, a short line out to its label.
const labels = []
let leaders = ''
for (const g of groups.filter((g) => g.anchor)) {
  const [ax, ay] = g.anchor.at
  const lx =
    g.anchor.side === 'left'
      ? Math.min(ax - 22, minX - 6)
      : Math.max(ax + 22, maxX + 6)
  leaders += `<g class="callout c-${g.name}"><circle class="face" fill="currentColor" stroke="currentColor" cx="${r(ax)}" cy="${r(ay)}" r="3.5" /><line x1="${r(ax + (g.anchor.side === 'left' ? -3.5 : 3.5))}" y1="${r(ay)}" x2="${r(lx)}" y2="${r(ay)}" stroke="currentColor" /><circle fill="currentColor" cx="${r(lx)}" cy="${r(ay)}" r="1.5" /></g>`
  labels.push({ part: g.name, side: g.anchor.side, x: lx, y: ay })
}
const labelW = 116,
  pad = 12
const vb = {
  x: minX - 6 - labelW - pad,
  y: minY - pad,
  w: maxX - minX + 12 + labelW * 2 + pad * 2,
  h: maxY - minY + pad * 2
}
const fromOf = (g) => {
  const m = [...g.body.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(
    (m) => [+m[1], +m[2]]
  )
  const c = center(m)
  return [r((shopCenter[0] - c[0]) * 0.85), r((shopCenter[1] - c[1]) * 0.85)]
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[vb.x, vb.y, vb.w, vb.h].map(r).join(' ')}">
  <!-- Hero concept "Storefront, exploded": a client's shop with a drawing of each service coming out of it, drawn like a parts-catalog plate. Generated; faces are styled by class. -->
  <g fill="none" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">
    <g class="assembly">${assembly}</g>
    ${groups
      .map(
        (g) =>
          `<g class="${g.name === 'shop' ? 'shop' : `service s-${g.name}`}"${
            g.name === 'shop'
              ? ''
              : ` style="--from: ${fromOf(g)
                  .map((n) => n + 'px')
                  .join(' ')}"`
          }>${g.body}</g>`
      )
      .join('\n    ')}
    <g class="callouts">${leaders}</g>
  </g>
</svg>
`
writeFileSync('src/assets/brand/storefront.svg', svg)
const json = labels.map((l) => ({
  part: l.part,
  side: l.side,
  x: r(((l.x - vb.x) / vb.w) * 100),
  y: r(((l.y - vb.y) / vb.h) * 100)
}))
writeFileSync(
  'src/components/hero/storefront-callouts.json',
  JSON.stringify(json, null, 2) + '\n'
)
console.log('viewBox', [vb.x, vb.y, vb.w, vb.h].map(r).join(' '))
console.log(JSON.stringify(json))
