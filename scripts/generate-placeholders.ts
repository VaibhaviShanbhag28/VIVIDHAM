/**
 * Generates original, royalty-free placeholder artwork (illustrated jewellery
 * and gemstones) into /public/demo as WebP. Nothing is downloaded or copied —
 * every image is drawn procedurally as SVG and rasterised with sharp.
 *
 *   npm run assets:placeholders
 *
 * Replace these with real product photography from the admin dashboard.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const W = 900;
const H = 1125;
const OUT = path.resolve(process.cwd(), "public", "demo");

type Gem = { light: string; mid: string; dark: string };
const GEMS: Record<string, Gem> = {
  emerald: { light: "#8be8bd", mid: "#1f8f62", dark: "#053d2a" },
  ruby: { light: "#ff9aae", mid: "#c4153c", dark: "#4f0314" },
  sapphire: { light: "#a9c2ff", mid: "#2447b8", dark: "#0a1850" },
  yellow: { light: "#fff4b8", mid: "#e3b523", dark: "#7d5304" },
  amethyst: { light: "#e8ccff", mid: "#8a3fc2", dark: "#360c57" },
  diamond: { light: "#ffffff", mid: "#e4edf5", dark: "#8fa3b5" },
  pink: { light: "#ffd6e6", mid: "#e0588f", dark: "#6e1238" },
};

type Bg = { a: string; b: string; tone: "light" | "dark" };
const BGS: Record<string, Bg> = {
  cream: { a: "#fbf6ec", b: "#e8dac2", tone: "light" },
  blush: { a: "#fbf1ec", b: "#e6cfc4", tone: "light" },
  sage: { a: "#eef3ee", b: "#c9d8cd", tone: "light" },
  stone: { a: "#f5f2ec", b: "#d8d0c3", tone: "light" },
  velvet: { a: "#1f6a53", b: "#07261d", tone: "dark" },
  midnight: { a: "#23324f", b: "#0b1120", tone: "dark" },
};

let uid = 0;
const nextId = (p: string) => `${p}${++uid}`;
const f = (n: number) => n.toFixed(1);

// ───────────── building blocks ─────────────

function gemGradient(g: Gem) {
  const id = nextId("g");
  return {
    id,
    def: `<radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${g.light}"/><stop offset="0.45" stop-color="${g.mid}"/><stop offset="1" stop-color="${g.dark}"/></radialGradient>`,
  };
}

function shade(angle: number, light = -2.3) {
  const l = 0.5 + 0.5 * Math.cos(angle - light);
  return l > 0.55 ? `fill="#fff" fill-opacity="${f((l - 0.55) * 0.9)}"` : `fill="#000" fill-opacity="${f((0.55 - l) * 0.55)}"`;
}

function sparkle(x: number, y: number, s: number, opacity = 0.9) {
  return `<path d="M${f(x)} ${f(y - s)} L${f(x + s * 0.18)} ${f(y - s * 0.18)} L${f(x + s)} ${f(y)} L${f(x + s * 0.18)} ${f(y + s * 0.18)} L${f(x)} ${f(y + s)} L${f(x - s * 0.18)} ${f(y + s * 0.18)} L${f(x - s)} ${f(y)} L${f(x - s * 0.18)} ${f(y - s * 0.18)}Z" fill="#fff" opacity="${opacity}"/>`;
}

/** Brilliant-cut oval / round stone. */
function ovalGem(cx: number, cy: number, rx: number, ry: number, g: Gem, withSparkle = true) {
  const grad = gemGradient(g);
  const P = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 16;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), a] as const;
  });
  const T = Array.from({ length: 8 }, (_, j) => {
    const a = (Math.PI * 2 * (j + 0.5)) / 8;
    return [cx + rx * 0.52 * Math.cos(a), cy + ry * 0.52 * Math.sin(a), a] as const;
  });
  let facets = "";
  for (let j = 0; j < 8; j++) {
    const p0 = P[2 * j], p1 = P[2 * j + 1], p2 = P[(2 * j + 2) % 16], t = T[j], tn = T[(j + 1) % 8];
    facets += `<polygon points="${f(p0[0])},${f(p0[1])} ${f(p1[0])},${f(p1[1])} ${f(t[0])},${f(t[1])}" ${shade(p0[2] + 0.2)}/>`;
    facets += `<polygon points="${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])} ${f(t[0])},${f(t[1])}" ${shade(p1[2] + 0.2)}/>`;
    facets += `<polygon points="${f(t[0])},${f(t[1])} ${f(p2[0])},${f(p2[1])} ${f(tn[0])},${f(tn[1])}" ${shade(p2[2] + 0.6)}/>`;
  }
  const table = T.map((t) => `${f(t[0])},${f(t[1])}`).join(" ");
  return {
    defs: grad.def,
    svg: `<g>
      <ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${grad.id})"/>
      <g stroke="#fff" stroke-opacity="0.18" stroke-width="0.8">${facets}</g>
      <polygon points="${table}" fill="#fff" fill-opacity="0.16" stroke="#fff" stroke-opacity="0.35" stroke-width="1"/>
      <ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${g.dark}" stroke-opacity="0.6" stroke-width="1.5"/>
      ${withSparkle ? sparkle(cx - rx * 0.35, cy - ry * 0.4, Math.min(rx, ry) * 0.28) : ""}
    </g>`,
  };
}

/** Step-cut (emerald cut) stone. */
function emeraldCutGem(cx: number, cy: number, w: number, h: number, g: Gem) {
  const grad = gemGradient(g);
  const oct = (s: number) => {
    const hw = (w / 2) * s, hh = (h / 2) * s, c = Math.min(w, h) * 0.17 * s;
    return [
      [cx - hw + c, cy - hh], [cx + hw - c, cy - hh], [cx + hw, cy - hh + c], [cx + hw, cy + hh - c],
      [cx + hw - c, cy + hh], [cx - hw + c, cy + hh], [cx - hw, cy + hh - c], [cx - hw, cy - hh + c],
    ];
  };
  const rings = [1, 0.82, 0.64, 0.46].map(oct);
  let bands = "";
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < 8; i++) {
      const a = rings[r][i], b = rings[r][(i + 1) % 8], c = rings[r + 1][(i + 1) % 8], d = rings[r + 1][i];
      const angle = Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx);
      bands += `<polygon points="${[a, b, c, d].map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" ${shade(angle + r * 0.5)}/>`;
    }
  }
  const pts = (ring: number[][]) => ring.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
  return {
    defs: grad.def,
    svg: `<g>
      <polygon points="${pts(rings[0])}" fill="url(#${grad.id})"/>
      <g stroke="#fff" stroke-opacity="0.22" stroke-width="0.8">${bands}</g>
      <polygon points="${pts(rings[3])}" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-opacity="0.35"/>
      <polygon points="${pts(rings[0])}" fill="none" stroke="${g.dark}" stroke-opacity="0.7" stroke-width="1.6"/>
      ${sparkle(cx - w * 0.2, cy - h * 0.25, Math.min(w, h) * 0.16)}
    </g>`,
  };
}

function pearl(cx: number, cy: number, r: number) {
  const id = nextId("p");
  return {
    defs: `<radialGradient id="${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#f1e8dc"/><stop offset="1" stop-color="#bfae98"/></radialGradient>`,
    svg: `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${id})"/><circle cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.4)}" r="${f(r * 0.22)}" fill="#fff" opacity="0.85"/>`,
  };
}

const goldDefs = `
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff2cf"/><stop offset="0.22" stop-color="#e3c27a"/><stop offset="0.5" stop-color="#a67c38"/>
    <stop offset="0.72" stop-color="#f0d99b"/><stop offset="1" stop-color="#7d5a22"/>
  </linearGradient>
  <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fbe7b0"/><stop offset="0.5" stop-color="#b8904a"/><stop offset="1" stop-color="#6f4f1c"/>
  </linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/></filter>`;

function background(bg: Bg) {
  const id = nextId("bg");
  const glow = bg.tone === "light" ? "#ffffff" : "#3c8f74";
  return {
    defs: `<radialGradient id="${id}" cx="50%" cy="38%" r="85%"><stop offset="0" stop-color="${bg.a}"/><stop offset="1" stop-color="${bg.b}"/></radialGradient>`,
    svg: `<rect width="${W}" height="${H}" fill="url(#${id})"/>
      <circle cx="${W * 0.18}" cy="${H * 0.14}" r="220" fill="${glow}" opacity="${bg.tone === "light" ? 0.35 : 0.12}" filter="url(#soft)"/>
      <circle cx="${W * 0.86}" cy="${H * 0.82}" r="260" fill="${glow}" opacity="${bg.tone === "light" ? 0.25 : 0.08}" filter="url(#soft)"/>
      <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${bg.tone === "light" ? "#b8975a" : "#d9c49a"}" stroke-opacity="0.35" stroke-width="1"/>`,
  };
}

function groundShadow(cx: number, cy: number, rx: number, dark: boolean) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${dark ? 0.35 : 0.13}" filter="url(#soft)"/>`;
}

function chain(points: [number, number][], size = 7) {
  let s = "";
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) * 0.62;
    s += i % 2 === 0
      ? `<ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(len)}" ry="${f(size * 0.55)}" transform="rotate(${f(ang)} ${f(mx)} ${f(my)})" fill="none" stroke="url(#gold)" stroke-width="${f(size * 0.42)}"/>`
      : `<ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(len)}" ry="${f(size * 0.22)}" transform="rotate(${f(ang)} ${f(mx)} ${f(my)})" fill="url(#goldV)"/>`;
  }
  return s;
}

/** Points along a quadratic Bézier. */
function quad(p0: [number, number], c: [number, number], p1: [number, number], n: number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
  });
}

function svgDoc(defs: string[], body: string[]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${goldDefs}${defs.join("")}</defs>${body.join("")}</svg>`;
}

// ───────────── jewellery pieces ─────────────

function ring(gem: Gem, bgKey: keyof typeof BGS, opts: { cut?: "oval" | "emerald" | "round"; halo?: boolean } = {}) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const cx = 450, bandY = 700;
  const body = [bg.svg, groundShadow(cx, 905, 230, dark)];
  // back of band
  body.push(`<ellipse cx="${cx}" cy="${bandY}" rx="205" ry="92" fill="none" stroke="#6f4f1c" stroke-width="30"/>`);
  body.push(`<ellipse cx="${cx}" cy="${bandY}" rx="205" ry="92" fill="none" stroke="url(#gold)" stroke-width="22"/>`);
  // front of band (lower arc, thicker)
  body.push(`<path d="M ${cx - 205} ${bandY} A 205 92 0 0 0 ${cx + 205} ${bandY}" fill="none" stroke="url(#goldV)" stroke-width="38" stroke-linecap="round"/>`);
  body.push(`<path d="M ${cx - 196} ${bandY - 6} A 196 86 0 0 0 ${cx + 196} ${bandY - 6}" fill="none" stroke="#fff5d8" stroke-opacity="0.55" stroke-width="4"/>`);
  // setting shoulders
  body.push(`<path d="M ${cx - 70} ${bandY - 92} Q ${cx} ${bandY - 40} ${cx + 70} ${bandY - 92}" fill="none" stroke="url(#gold)" stroke-width="16"/>`);
  const gy = 560;
  if (opts.halo) {
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      const d = ovalGem(cx + 138 * Math.cos(a), gy + 118 * Math.sin(a), 15, 15, GEMS.diamond, false);
      defs.push(d.defs);
      body.push(d.svg);
    }
    body.push(`<ellipse cx="${cx}" cy="${gy}" rx="120" ry="100" fill="url(#gold)"/>`);
  }
  // prongs
  for (const dx of [-78, 78]) {
    body.push(`<rect x="${cx + dx - 7}" y="${gy - 70}" width="14" height="150" rx="7" fill="url(#goldV)"/>`);
  }
  const stone =
    opts.cut === "emerald" ? emeraldCutGem(cx, gy, 190, 150, gem) : opts.cut === "round" ? ovalGem(cx, gy, 96, 96, gem) : ovalGem(cx, gy, 112, 90, gem);
  defs.push(stone.defs);
  body.push(`<g filter="url(#lift)">${stone.svg}</g>`);
  for (const [dx, dy] of [[-80, -62], [80, -62], [-80, 62], [80, 62]]) {
    body.push(`<circle cx="${cx + dx * 0.95}" cy="${gy + dy * 0.95}" r="9" fill="url(#gold)"/>`);
  }
  return svgDoc(defs, body);
}

function necklace(gem: Gem, bgKey: keyof typeof BGS, opts: { collar?: boolean; pearls?: boolean } = {}) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg];
  const pts = quad([110, 90], [450, 1050], [790, 90], 90);
  if (opts.pearls) {
    const beads = quad([120, 110], [450, 1020], [780, 110], 44);
    body.push(`<path d="M120 110 Q450 1020 780 110" fill="none" stroke="#c9b89e" stroke-width="2"/>`);
    for (const [x, y] of beads) {
      const p = pearl(x, y, 17);
      defs.push(p.defs);
      body.push(p.svg);
    }
  } else {
    body.push(chain(pts, 9));
  }
  if (opts.collar) {
    const setPts = quad([200, 300], [450, 950], [700, 300], 12);
    for (const [i, [x, y]] of setPts.entries()) {
      if (i === 0 || i === setPts.length - 1) continue;
      const size = 26 + 18 * Math.sin((Math.PI * i) / (setPts.length - 1));
      body.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(size + 8)}" fill="url(#gold)"/>`);
      const g = ovalGem(x, y, size, size * 0.86, i % 2 ? gem : GEMS.diamond, false);
      defs.push(g.defs);
      body.push(g.svg);
    }
  }
  // pendant drop
  const [bx, by] = pts[45];
  body.push(`<rect x="${bx - 9}" y="${by - 6}" width="18" height="46" rx="9" fill="url(#goldV)"/>`);
  body.push(`<ellipse cx="${bx}" cy="${by + 150}" rx="${opts.collar ? 88 : 78}" ry="${opts.collar ? 116 : 104}" fill="url(#gold)" filter="url(#lift)"/>`);
  const drop = ovalGem(bx, by + 150, opts.collar ? 72 : 63, opts.collar ? 100 : 88, gem);
  defs.push(drop.defs);
  body.push(drop.svg);
  body.push(groundShadow(450, 1010, 160, dark));
  return svgDoc(defs, body);
}

function earrings(gem: Gem, bgKey: keyof typeof BGS, opts: { pearl?: boolean } = {}) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg, groundShadow(450, 960, 300, dark)];
  for (const cx of [300, 600]) {
    const stud = ovalGem(cx, 290, 38, 38, GEMS.diamond);
    defs.push(stud.defs);
    body.push(`<circle cx="${cx}" cy="290" r="48" fill="url(#gold)"/>`, stud.svg);
    body.push(chain(quad([cx, 335], [cx + 6, 400], [cx, 470], 8), 6));
    body.push(`<ellipse cx="${cx}" cy="640" rx="104" ry="168" fill="none" stroke="url(#gold)" stroke-width="14" filter="url(#lift)"/>`);
    if (opts.pearl) {
      const p = pearl(cx, 650, 70);
      defs.push(p.defs);
      body.push(p.svg);
    } else {
      const d = ovalGem(cx, 650, 80, 132, gem);
      defs.push(d.defs);
      body.push(d.svg);
    }
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      body.push(`<circle cx="${f(cx + 104 * Math.cos(a))}" cy="${f(640 + 168 * Math.sin(a))}" r="7" fill="#f7f1e3" stroke="#b8904a" stroke-width="2"/>`);
    }
  }
  return svgDoc(defs, body);
}

function bangle(gem: Gem | null, bgKey: keyof typeof BGS) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg, groundShadow(450, 880, 300, dark)];
  for (const [dy, rx] of [[-70, 250], [60, 262]] as const) {
    const cy = 600 + dy;
    body.push(`<ellipse cx="450" cy="${cy}" rx="${rx}" ry="${rx * 0.42}" fill="none" stroke="#6f4f1c" stroke-width="54"/>`);
    body.push(`<ellipse cx="450" cy="${cy}" rx="${rx}" ry="${rx * 0.42}" fill="none" stroke="url(#gold)" stroke-width="44"/>`);
    body.push(`<path d="M ${450 - rx} ${cy} A ${rx} ${rx * 0.42} 0 0 0 ${450 + rx} ${cy}" fill="none" stroke="#fff3d0" stroke-opacity="0.5" stroke-width="5"/>`);
    // engraved dots / stones along the front arc
    for (let i = 1; i < 12; i++) {
      const a = (Math.PI * i) / 12;
      const x = 450 - rx * Math.cos(a), y = cy + rx * 0.42 * Math.sin(a);
      if (gem && i % 2 === 1) {
        const g = ovalGem(x, y, 14, 12, gem, false);
        defs.push(g.defs);
        body.push(g.svg);
      } else {
        body.push(`<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="#7d5a22"/>`);
      }
    }
  }
  return svgDoc(defs, body);
}

function bracelet(gem: Gem, bgKey: keyof typeof BGS) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg, groundShadow(450, 860, 320, dark)];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.04 + (Math.PI * 1.92 * i) / (n - 1);
    const x = 450 + 290 * Math.cos(a), y = 590 + 150 * Math.sin(a);
    const front = Math.sin(a) > 0;
    body.push(`<rect x="${f(x - 24)}" y="${f(y - 20)}" width="48" height="40" rx="10" fill="url(#gold)" opacity="${front ? 1 : 0.8}"/>`);
    const g = ovalGem(x, y, 17, 15, i % 3 === 0 ? gem : GEMS.diamond, false);
    defs.push(g.defs);
    body.push(g.svg);
  }
  return svgDoc(defs, body);
}

function pendant(gem: Gem, bgKey: keyof typeof BGS) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg];
  body.push(chain(quad([150, 60], [260, 330], [450, 430], 30), 6));
  body.push(chain(quad([750, 60], [640, 330], [450, 430], 30), 6));
  body.push(`<circle cx="450" cy="440" r="22" fill="none" stroke="url(#gold)" stroke-width="9"/>`);
  for (let i = 0; i < 20; i++) {
    const a = (Math.PI * 2 * i) / 20;
    const p = pearl(450 + 138 * Math.cos(a), 640 + 160 * Math.sin(a), 16);
    defs.push(p.defs);
    body.push(p.svg);
  }
  body.push(`<ellipse cx="450" cy="640" rx="118" ry="140" fill="url(#gold)" filter="url(#lift)"/>`);
  const g = emeraldCutGem(450, 640, 190, 230, gem);
  defs.push(g.defs);
  body.push(g.svg);
  body.push(groundShadow(450, 930, 170, dark));
  return svgDoc(defs, body);
}

function looseGem(gem: Gem, bgKey: keyof typeof BGS, cut: "emerald" | "oval" | "round" | "cushion") {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg, groundShadow(450, 800, 240, dark)];
  const g = cut === "emerald" ? emeraldCutGem(450, 560, 400, 310, gem) : cut === "round" ? ovalGem(450, 560, 220, 220, gem) : cut === "cushion" ? emeraldCutGem(450, 560, 360, 360, gem) : ovalGem(450, 560, 250, 195, gem);
  defs.push(g.defs);
  body.push(`<g filter="url(#lift)">${g.svg}</g>`);
  body.push(sparkle(250, 330, 26, 0.7), sparkle(680, 760, 18, 0.5));
  return svgDoc(defs, body);
}

function bridalSet(bgKey: keyof typeof BGS) {
  const bg = background(BGS[bgKey]);
  const defs = [bg.defs];
  const body = [bg.svg];
  const pts = quad([90, 40], [450, 900], [810, 40], 70);
  body.push(chain(pts, 10));
  const setPts = quad([150, 180], [450, 860], [750, 180], 16);
  for (const [i, [x, y]] of setPts.entries()) {
    if (i === 0 || i === setPts.length - 1) continue;
    const size = 22 + 22 * Math.sin((Math.PI * i) / (setPts.length - 1));
    body.push(`<path d="M ${f(x - size)} ${f(y)} Q ${f(x)} ${f(y + size * 3.2)} ${f(x + size)} ${f(y)}" fill="url(#gold)"/>`);
    const g = ovalGem(x, y + size * 1.1, size * 0.62, size * 0.9, i % 2 ? GEMS.ruby : GEMS.emerald, false);
    defs.push(g.defs);
    body.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(size)}" fill="url(#gold)"/>`, g.svg);
    const p = pearl(x, y + size * 2.4, size * 0.38);
    defs.push(p.defs);
    body.push(p.svg);
  }
  const centre = emeraldCutGem(450, 640, 150, 180, GEMS.emerald);
  defs.push(centre.defs);
  body.push(`<ellipse cx="450" cy="640" rx="100" ry="120" fill="url(#gold)" filter="url(#lift)"/>`, centre.svg);
  for (const cx of [160, 740]) {
    body.push(`<circle cx="${cx}" cy="900" r="46" fill="url(#gold)"/>`);
    const g = ovalGem(cx, 900, 34, 34, GEMS.ruby);
    defs.push(g.defs);
    body.push(g.svg);
    const p = pearl(cx, 985, 20);
    defs.push(p.defs);
    body.push(p.svg);
  }
  return svgDoc(defs, body);
}

function gemCluster(bgKey: keyof typeof BGS) {
  const bg = background(BGS[bgKey]);
  const dark = BGS[bgKey].tone === "dark";
  const defs = [bg.defs];
  const body = [bg.svg, groundShadow(450, 880, 330, dark)];
  const stones: [number, number, number, number, Gem, "oval" | "emerald"][] = [
    [300, 520, 120, 95, GEMS.emerald, "emerald"],
    [600, 470, 90, 90, GEMS.ruby, "oval"],
    [520, 700, 110, 85, GEMS.sapphire, "oval"],
    [250, 760, 70, 70, GEMS.yellow, "oval"],
    [700, 740, 60, 75, GEMS.amethyst, "oval"],
    [420, 330, 50, 50, GEMS.diamond, "oval"],
  ];
  for (const [x, y, rx, ry, gem, cut] of stones) {
    const g = cut === "emerald" ? emeraldCutGem(x, y, rx * 2, ry * 2, gem) : ovalGem(x, y, rx, ry, gem);
    defs.push(g.defs);
    body.push(`<g filter="url(#lift)">${g.svg}</g>`);
  }
  return svgDoc(defs, body);
}

// ───────────── output ─────────────

const IMAGES: Record<string, () => string> = {
  // hero & story
  hero: () => necklace(GEMS.emerald, "velvet", { collar: true }),
  story: () => gemCluster("cream"),
  // products (primary + alternate views)
  "ring-emerald": () => ring(GEMS.emerald, "cream", { cut: "emerald", halo: true }),
  "ring-emerald-alt": () => ring(GEMS.emerald, "velvet", { cut: "emerald", halo: true }),
  "ring-ruby": () => ring(GEMS.ruby, "blush", { cut: "oval" }),
  "ring-ruby-alt": () => ring(GEMS.ruby, "midnight", { cut: "oval" }),
  "ring-sapphire": () => ring(GEMS.sapphire, "stone", { cut: "round", halo: true }),
  "ring-diamond": () => ring(GEMS.diamond, "sage", { cut: "round" }),
  "necklace-emerald": () => necklace(GEMS.emerald, "cream", { collar: true }),
  "necklace-emerald-alt": () => necklace(GEMS.emerald, "velvet", { collar: true }),
  "necklace-ruby": () => necklace(GEMS.ruby, "blush"),
  "necklace-pearl": () => necklace(GEMS.pink, "stone", { pearls: true }),
  "earrings-emerald": () => earrings(GEMS.emerald, "sage"),
  "earrings-emerald-alt": () => earrings(GEMS.emerald, "velvet"),
  "earrings-sapphire": () => earrings(GEMS.sapphire, "stone"),
  "earrings-pearl": () => earrings(GEMS.diamond, "blush", { pearl: true }),
  "bangle-gold": () => bangle(null, "cream"),
  "bangle-gold-alt": () => bangle(null, "velvet"),
  "bangle-ruby": () => bangle(GEMS.ruby, "blush"),
  "bracelet-diamond": () => bracelet(GEMS.diamond, "stone"),
  "bracelet-sapphire": () => bracelet(GEMS.sapphire, "sage"),
  "pendant-emerald": () => pendant(GEMS.emerald, "cream"),
  "pendant-amethyst": () => pendant(GEMS.amethyst, "blush"),
  "gem-emerald": () => looseGem(GEMS.emerald, "velvet", "emerald"),
  "gem-emerald-alt": () => looseGem(GEMS.emerald, "cream", "emerald"),
  "gem-ruby": () => looseGem(GEMS.ruby, "midnight", "oval"),
  "gem-sapphire": () => looseGem(GEMS.sapphire, "stone", "cushion"),
  "gem-yellow-sapphire": () => looseGem(GEMS.yellow, "cream", "oval"),
  "gem-amethyst": () => looseGem(GEMS.amethyst, "sage", "round"),
  "bridal-set": () => bridalSet("velvet"),
  "bridal-set-alt": () => bridalSet("cream"),
  // categories
  "category-necklaces": () => necklace(GEMS.ruby, "cream", { collar: true }),
  "category-earrings": () => earrings(GEMS.emerald, "blush"),
  "category-rings": () => ring(GEMS.sapphire, "sage", { cut: "oval", halo: true }),
  "category-bangles": () => bangle(GEMS.emerald, "stone"),
  "category-bracelets": () => bracelet(GEMS.ruby, "cream"),
  "category-pendants": () => pendant(GEMS.sapphire, "stone"),
  "category-gemstones": () => gemCluster("velvet"),
  "category-bridal-jewellery": () => bridalSet("blush"),
  "category-custom-jewellery": () => ring(GEMS.pink, "cream", { cut: "emerald" }),
};

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const [name, draw] of Object.entries(IMAGES)) {
    const svg = draw();
    await sharp(Buffer.from(svg), { density: 96 }).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`));
    process.stdout.write(`✔ ${name}.webp\n`);
  }
  console.log(`\nGenerated ${Object.keys(IMAGES).length} placeholder images in public/demo`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
