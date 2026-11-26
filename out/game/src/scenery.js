// Skyline Courier - sky, terrain, runway and beacon rendering.
import { CANVAS, PALETTE, WORLD } from './config.js';
import { clamp, wrapAngle } from './physics.js';
import { riverCenterX } from './state.js';

export function paletteFor(state) {
  return state.timeOfDay === 'dusk' ? PALETTE.dusk : PALETTE.day;
}

// Chase camera: anchored behind the plane so the horizon never fights the pilot.
export function makeView(state) {
  const p = state.plane;
  return {
    cam: {
      x: p.x - Math.sin(p.hdg) * WORLD.camBack,
      y: p.y + WORLD.camUp,
      z: p.z - Math.cos(p.hdg) * WORLD.camBack
    },
    hdg: p.hdg,
    pitch: p.pitch,
    roll: p.roll,
    horizon: CANVAS.HORIZON + clamp(p.pitch, -0.5, 0.5) * 260 + clamp(p.vs * 0.22, -26, 26)
  };
}

// World point -> screen point. localZ is forward distance from the camera.
export function project(view, x, y, z) {
  const cs = Math.cos(view.hdg), sn = Math.sin(view.hdg);
  const dx = x - view.cam.x, dz = z - view.cam.z;
  const localZ = dx * sn + dz * cs;
  if (localZ < WORLD.near) return null;
  const localX = dx * cs - dz * sn;
  const s = WORLD.focal / localZ;
  return {
    x: CANVAS.CX + localX * s,
    y: view.horizon - (y - view.cam.y) * s,
    s,
    z: localZ
  };
}

function puff(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSky(ctx, state, view) {
  const c = paletteFor(state);
  const grad = ctx.createLinearGradient(0, 0, 0, view.horizon + 140);
  grad.addColorStop(0, c.skyTop);
  grad.addColorStop(0.62, c.skyMid);
  grad.addColorStop(1, c.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS.W, CANVAS.H);

  const sunX = state.timeOfDay === 'dusk' ? 990 : 1030;
  const sunY = view.horizon - (state.timeOfDay === 'dusk' ? 92 : 168);
  const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 190);
  glow.addColorStop(0, c.sun);
  glow.addColorStop(0.16, c.sun + 'bb');
  glow.addColorStop(1, c.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
  puff(ctx, sunX, sunY, 27, 27, c.sun);

  const clouds = state.scenery.clouds
    .map((cloud) => ({ cloud, pt: project(view, cloud.x, cloud.y, cloud.z) }))
    .filter((item) => item.pt && item.pt.y < view.horizon + 30)
    .sort((a, b) => b.pt.z - a.pt.z);
  for (const { cloud, pt } of clouds) {
    const w = cloud.w * pt.s;
    if (w < 4 || pt.x < -w * 2 || pt.x > CANVAS.W + w * 2) continue;
    ctx.globalAlpha = 0.28 + cloud.tone * 0.34;
    puff(ctx, pt.x, pt.y, w, w * 0.3, c.cloud);
    puff(ctx, pt.x - w * 0.45, pt.y + w * 0.06, w * 0.55, w * 0.21, c.cloudShade);
    puff(ctx, pt.x + w * 0.5, pt.y + w * 0.04, w * 0.5, w * 0.19, c.cloudShade);
  }
  ctx.globalAlpha = 1;
}

function groundCorner(view, forward, lateral) {
  return {
    x: view.cam.x + Math.sin(view.hdg) * forward + Math.cos(view.hdg) * lateral,
    z: view.cam.z + Math.cos(view.hdg) * forward - Math.sin(view.hdg) * lateral
  };
}

function drawGroundBands(ctx, view, palette) {
  const steps = 48;
  const corner = (forward, lateral) => {
    const p = groundCorner(view, forward, lateral);
    return project(view, p.x, 0, p.z);
  };
  for (let i = steps - 1; i >= 0; i--) {
    const far = WORLD.near + (WORLD.viewDistance - WORLD.near) * ((i + 1) / steps) ** 1.7;
    const nearZ = WORLD.near + (WORLD.viewDistance - WORLD.near) * (i / steps) ** 1.7;
    const corners = [
      corner(far, -5200), corner(far, 5200),
      corner(nearZ, 5200), corner(nearZ, -5200)
    ];
    if (corners.some((p) => !p)) continue;
    ctx.fillStyle = i % 2 === 0 ? palette.ground : palette.groundAlt;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let k = 1; k < 4; k++) ctx.lineTo(corners[k].x, corners[k].y);
    ctx.closePath();
    ctx.fill();
    if (i % 6 === 0) {
      ctx.strokeStyle = palette.field;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawHills(ctx, view, palette, state) {
  const hills = state.scenery.hills.slice().sort((a, b) => b.z - a.z);
  for (const hill of hills) {
    const base = project(view, hill.x, 0, hill.z);
    if (!base || base.y < view.horizon - 260 || base.y > CANVAS.H + 200) continue;
    const width = hill.w * base.s;
    const height = hill.h * base.s;
    if (width < 6 || base.x + width < 0 || base.x - width > CANVAS.W) continue;
    ctx.fillStyle = hill.key === 'far' ? palette.hillFar : hill.key === 'mid' ? palette.hillMid : palette.hillNear;
    ctx.globalAlpha = hill.key === 'far' ? 0.75 : 0.92;
    ctx.beginPath();
    ctx.moveTo(base.x - width * 0.58, base.y + 8);
    ctx.quadraticCurveTo(base.x - width * 0.4, base.y - height * 0.82, base.x - width * 0.08, base.y - height);
    ctx.quadraticCurveTo(base.x + width * 0.18, base.y - height * (0.72 + hill.tone * 0.2), base.x + width * 0.5, base.y + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRiver(ctx, view, palette, state) {
  const phase = state.scenery.riverPhase;
  const left = [], right = [];
  for (let forward = WORLD.near + 20; forward < WORLD.viewDistance; forward += 90) {
    const z = view.cam.z + Math.cos(view.hdg) * forward;
    const center = riverCenterX(z, state.scenery);
    const bend = Math.sin(z / 340 + phase) * 22;
    const a = project(view, center - 74 + bend, 0, z);
    const b = project(view, center + 74 + bend, 0, z);
    if (!a || !b) continue;
    left.push(a); right.push(b);
  }
  if (left.length < 2) return;
  ctx.fillStyle = palette.river;
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (const p of left.slice(1)) ctx.lineTo(p.x, p.y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.riverEdge;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  for (const edge of [left, right]) {
    ctx.beginPath();
    edge.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawTreesAndTowns(ctx, view, palette, state) {
  const items = [];
  for (const tree of state.scenery.trees) {
    const pt = project(view, tree.x, 0, tree.z);
    if (pt) items.push({ pt, kind: 'tree', data: tree });
  }
  for (const house of state.scenery.houses) {
    const pt = project(view, house.x, 0, house.z);
    if (pt) items.push({ pt, kind: 'house', data: house });
  }
  items.sort((a, b) => b.pt.z - a.pt.z);
  for (const item of items) {
    const { pt, data, kind } = item;
    const h = (kind === 'tree' ? data.h : data.h || 22) * pt.s;
    if (h < 2 || pt.x < -60 || pt.x > CANVAS.W + 60 || pt.y > CANVAS.H + 60) continue;
    if (kind === 'tree') {
      const w = h * 0.42;
      ctx.fillStyle = '#4a392d';
      ctx.fillRect(pt.x - w * 0.08, pt.y - h * 0.32, Math.max(1, w * 0.16), h * 0.34);
      ctx.fillStyle = data.tone > 0.5 ? palette.forest : palette.hillNear;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - h);
      ctx.lineTo(pt.x - w, pt.y - h * 0.24);
      ctx.lineTo(pt.x + w, pt.y - h * 0.24);
      ctx.closePath();
      ctx.fill();
    } else {
      const w = Math.max(3, (data.w || 26) * pt.s);
      ctx.fillStyle = palette.town;
      ctx.fillRect(pt.x - w / 2, pt.y - h, w, h);
      ctx.fillStyle = palette.roof;
      ctx.beginPath();
      ctx.moveTo(pt.x - w * 0.62, pt.y - h);
      ctx.lineTo(pt.x, pt.y - h * 1.42);
      ctx.lineTo(pt.x + w * 0.62, pt.y - h);
      ctx.closePath();
      ctx.fill();
      if (h > 7) {
        ctx.fillStyle = state.timeOfDay === 'dusk' ? PALETTE.dusk.sun : palette.detail;
        ctx.fillRect(pt.x - w * 0.24, pt.y - h * 0.72, w * 0.2, h * 0.2);
        ctx.fillRect(pt.x + w * 0.08, pt.y - h * 0.72, w * 0.2, h * 0.2);
      }
      if (data.name && pt.y < CANVAS.H - 100) {
        ctx.fillStyle = palette.town;
        ctx.font = 'bold 13px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data.name.toUpperCase(), pt.x, pt.y - h * 1.7);
      }
    }
  }
}

export function drawTerrain(ctx, state, view) {
  const palette = paletteFor(state);
  drawGroundBands(ctx, view, palette);
  drawHills(ctx, view, palette, state);
  drawRiver(ctx, view, palette, state);
  drawTreesAndTowns(ctx, view, palette, state);
}

function runwayQuad(ctx, view, x0, x1, z0, z1) {
  const corners = [
    project(view, x0, 0, z0), project(view, x1, 0, z0),
    project(view, x1, 0, z1), project(view, x0, 0, z1)
  ];
  if (corners.some((p) => !p)) return null;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  return corners;
}

export function drawRunway(ctx, state, view) {
  const rw = WORLD.runway;
  const c = paletteFor(state);
  if (!runwayQuad(ctx, view, rw.x - rw.width / 2 - 26, rw.x + rw.width / 2 + 26, rw.z0 - 170, rw.z1 + 170)) return;
  ctx.fillStyle = c.field;
  ctx.fill();
  if (!runwayQuad(ctx, view, rw.x - rw.width / 2, rw.x + rw.width / 2, rw.z0, rw.z1)) return;
  ctx.fillStyle = '#39474d';
  ctx.fill();
  ctx.strokeStyle = c.detail;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  for (let z = rw.z0 + 110; z < rw.z1 - 60; z += 140) {
    if (runwayQuad(ctx, view, rw.x - 2.4, rw.x + 2.4, z, z + 64)) {
      ctx.fillStyle = c.detail;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (let i = 0; i < 8; i++) {
    const x = rw.x - 38 + i * 11;
    if (runwayQuad(ctx, view, x, x + 5.5, rw.z0 + 28, rw.z0 + 78)) {
      ctx.fillStyle = c.detail;
      ctx.fill();
    }
  }
  for (let z = rw.z0; z < rw.z1; z += 180) {
    for (const side of [-1, 1]) {
      const pt = project(view, rw.x + side * (rw.width / 2 + 10), 1, z);
      if (!pt || pt.s < 0.02) continue;
      ctx.fillStyle = PALETTE.gold;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(state.time * 3 + z);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, clamp(3.4 * pt.s * 6, 1.5, 6), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  const mark = project(view, rw.x, 0, rw.z0 + 190);
  if (mark && mark.s > 0.08) {
    ctx.fillStyle = c.detail;
    ctx.globalAlpha = 0.75;
    ctx.font = `bold ${Math.min(74, 58 * mark.s * 4)}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('09', mark.x, mark.y);
    ctx.globalAlpha = 1;
  }
}

export function drawTargetRings(ctx, state, view) {
  const rings = WORLD.rings
    .map((ring, i) => ({ ring, i, pt: project(view, ring.x, ring.y, ring.z) }))
    .filter((item) => item.pt && item.pt.z < 6400)
    .sort((a, b) => b.pt.z - a.pt.z);
  for (const { ring, i, pt } of rings) {
    const r = ring.radius * pt.s;
    if (r < 5 || pt.x < -r * 2 || pt.x > CANVAS.W + r * 2) continue;
    const passed = i < state.mission.ringsPassed;
    const active = i === state.mission.ringsPassed;
    const alpha = passed ? 0.24 : active ? 1 : 0.5;
    ctx.globalAlpha = alpha;
    const glow = ctx.createRadialGradient(pt.x, pt.y, r * 0.66, pt.x, pt.y, r * 1.5);
    glow.addColorStop(0, PALETTE.gold + '00');
    glow.addColorStop(0.55, PALETTE.gold + '88');
    glow.addColorStop(1, PALETTE.gold + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(pt.x - r * 1.6, pt.y - r * 1.6, r * 3.2, r * 3.2);
    ctx.strokeStyle = passed ? cDim() : PALETTE.gold;
    ctx.lineWidth = Math.max(2, r * 0.075);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.strokeStyle = '#fff5d6';
    for (let d = 0; d < 8; d++) {
      const a = d * Math.PI / 4 + state.time * 0.45;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 1.12, a, a + 0.22);
      ctx.stroke();
    }
    if (active && r > 26) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BEACON ${i + 1}  ${Math.round(pt.z)}m`, pt.x, pt.y - r - 16);
    }
    ctx.globalAlpha = 1;
  }
}

function cDim() { return '#8f9a84'; }
