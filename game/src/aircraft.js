// Skyline Courier - the hand-built mail plane in chase view.
import { CANVAS, PALETTE } from './config.js';
import { clamp } from './physics.js';
import { project } from './scenery.js';

function polygon(ctx, points, fill, stroke = '#1b2b31', lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawShadow(ctx, state, view) {
  const p = state.plane;
  const spot = project(view, p.x, 0, p.z + 10);
  if (!spot) return;
  const size = clamp(120 * spot.s, 6, 190);
  ctx.save();
  ctx.globalAlpha = clamp(0.28 - p.y / 6000, 0.04, 0.28);
  ctx.fillStyle = '#14201d';
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.y, size, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawAircraft(ctx, state, view) {
  const p = state.plane;
  drawShadow(ctx, state, view);
  const baseX = CANVAS.CX;
  const baseY = view.horizon + 164;
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(p.roll * 0.92);
  ctx.scale(1, clamp(1 - p.pitch * 0.42, 0.78, 1.18));

  // Tail plane and fin behind the wing.
  polygon(ctx, [[-52, 62], [-12, 50], [12, 50], [52, 62], [46, 84], [-46, 84]], '#d8c9a8');
  polygon(ctx, [[-7, 66], [-12, 6], [0, -14], [12, 6], [7, 66]], '#e9ddc2');
  polygon(ctx, [[-10, 30], [-11, -4], [0, -12], [11, -4], [10, 30]], '#b87856', null);

  // Wings: swept leading edge, flaps and aileron seams.
  polygon(ctx, [[-13, -22], [-108, 12], [-112, 28], [-16, 16]], '#eee2c6');
  polygon(ctx, [[13, -22], [108, 12], [112, 28], [16, 16]], '#eee2c6');
  ctx.strokeStyle = '#9d8c6c';
  ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 22, -12);
    ctx.lineTo(side * 96, 16);
    ctx.moveTo(side * 62, -1);
    ctx.lineTo(side * 66, 23);
    ctx.stroke();
    ctx.strokeStyle = '#f6efdc';
    ctx.beginPath();
    ctx.moveTo(side * 12, -18);
    ctx.lineTo(side * 104, 10);
    ctx.stroke();
    ctx.strokeStyle = '#9d8c6c';
  }
  // Mail-blue wing chevrons.
  for (const side of [-1, 1]) {
    polygon(ctx, [[side * 44, -4], [side * 76, 8], [side * 74, 16], [side * 42, 4]], '#3f7d92', null);
  }

  // Fuselage.
  polygon(ctx, [
    [-15, 78], [-17, 34], [-16, -30], [-11, -74], [0, -101],
    [11, -74], [16, -30], [17, 34], [15, 78]
  ], '#f2e8cf');
  polygon(ctx, [[-16, -28], [-16, 4], [16, 4], [16, -28], [9, -63], [-9, -63]], '#dccda9', null);
  ctx.strokeStyle = '#b87856';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 24); ctx.lineTo(16, 24);
  ctx.moveTo(-13, 46); ctx.lineTo(13, 46);
  ctx.stroke();
  ctx.strokeStyle = '#8d7d61';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-13, -70); ctx.lineTo(-13, 74);
  ctx.moveTo(13, -70); ctx.lineTo(13, 74);
  ctx.stroke();

  // Canopy, frame and pilot silhouette.
  polygon(ctx, [[-11, -58], [-9, -24], [9, -24], [11, -58], [0, -68]], PALETTE.glass);
  ctx.strokeStyle = '#d7c9a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#20343a';
  ctx.beginPath();
  ctx.ellipse(0, -40, 5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7d9b7';
  ctx.fillRect(-9, -27, 18, 2);

  // Courier emblem on the tail.
  ctx.save();
  ctx.translate(0, 62);
  ctx.fillStyle = '#3f7d92';
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f5e9cd'; ctx.lineWidth = 1.4;
  ctx.strokeRect(-4.5, -3, 9, 6);
  ctx.beginPath(); ctx.moveTo(-4.5, -3); ctx.lineTo(0, 1); ctx.lineTo(4.5, -3); ctx.stroke();
  ctx.restore();

  // Landing gear, drawn only when selected.
  if (p.gear) {
    ctx.strokeStyle = '#2b3b3d';
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 20, 4); ctx.lineTo(side * 30, 38); ctx.stroke();
      ctx.fillStyle = '#1a2225';
      ctx.beginPath(); ctx.ellipse(side * 31, 41, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(0, 78); ctx.lineTo(0, 98); ctx.stroke();
    ctx.fillStyle = '#1a2225';
    ctx.beginPath(); ctx.ellipse(0, 100, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Propeller: a blurred disc with a bright hub and two faint blades.
  ctx.save();
  ctx.translate(0, -103);
  ctx.globalAlpha = 0.13 + p.throttle * 0.18;
  ctx.fillStyle = '#dcecf0';
  ctx.beginPath(); ctx.ellipse(0, 0, 43, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.55;
  const spin = state.time * 34;
  ctx.strokeStyle = '#e8f3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(spin) * 40, -Math.sin(spin) * 5);
  ctx.lineTo(Math.cos(spin) * 40, Math.sin(spin) * 5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#33454a';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Navigation lights: port red, starboard green, tail white.
  const blink = 0.55 + 0.45 * Math.sin(state.time * 5);
  const lights = [[-112, 20, '#ff6f61'], [112, 20, '#7ee6a4'], [0, 86, '#fff4d6']];
  for (const [x, y, color] of lights) {
    ctx.fillStyle = color;
    ctx.globalAlpha = blink;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18 * blink;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
