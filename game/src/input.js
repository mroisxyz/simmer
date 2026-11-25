// input.js — turns mouse, touch and keyboard events into station choices.
// The pointer is rescaled from CSS pixels to the fixed 1280x720 canvas grid.

import { LAYOUT } from './config.js';
import { selectTicket } from './state.js';

export function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function binRect(index) {
  const b = LAYOUT.bins;
  return { x: b.x + index * (b.w + b.gap), y: b.y, w: b.w, h: b.h };
}

// Which station is under a point? Also drives hover outlines in the renderer.
export function hitTest(p) {
  const o = LAYOUT.order;
  if (inRect(p, o)) {
    for (let i = 0; i < 3; i++) {
      const t = { x: LAYOUT.ticket.x, y: LAYOUT.ticket.y + i * (LAYOUT.ticket.h + LAYOUT.ticket.gap),
        w: LAYOUT.ticket.w, h: LAYOUT.ticket.h };
      if (inRect(p, t)) return { kind: 'ticket', index: i };
    }
    return { kind: 'order' };
  }
  for (let i = 0; i < 6; i++) if (inRect(p, binRect(i))) return { kind: 'bin', index: i };
  if (inRect(p, LAYOUT.board)) return { kind: 'board' };
  if (inRect(p, LAYOUT.stove)) return { kind: 'stove' };
  if (inRect(p, LAYOUT.plate)) return { kind: 'plate' };
  return { kind: 'none' };
}

function canvasPoint(canvas, event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (LAYOUT.width / (r.width || LAYOUT.width)),
    y: (event.clientY - r.top) * (LAYOUT.height / (r.height || LAYOUT.height)),
  };
}

function angleToPan(p) {
  const s = LAYOUT.stove;
  return Math.atan2(p.y - (s.y + 92), p.x - (s.x + 104));
}

export function attachInput(canvas, state, actions, hooks = {}) {
  const drag = { active: false, kind: 'none', x: 0, y: 0, travel: 0, angle: null };
  state.pointer = { x: -100, y: -100, down: false, region: 'none' };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = canvasPoint(canvas, e);
    const hit = hitTest(p);
    state.pointer.x = p.x; state.pointer.y = p.y; state.pointer.down = true;
    state.pointer.region = hit.kind;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    drag.active = true; drag.kind = hit.kind; drag.x = p.x; drag.y = p.y;
    drag.travel = 0; drag.angle = hit.kind === 'stove' ? angleToPan(p) : null;

    if (hit.kind === 'bin') actions.pickIngredient(state, hit.index, p);
    else if (hit.kind === 'board') actions.chopAt(state, p);
    else if (hit.kind === 'plate') actions.plateClick(state, p);
    else if (hit.kind === 'ticket') actions.selectTicketAt(state, hit.index);
    else if (hit.kind === 'stove') actions.panPress(state, p);
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = canvasPoint(canvas, e);
    const hit = hitTest(p);
    state.pointer.x = p.x; state.pointer.y = p.y; state.pointer.region = hit.kind;
    if (!drag.active) return;
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    drag.travel += Math.abs(dx) + Math.abs(dy);
    if (drag.kind === 'board' && drag.travel > 26) {
      actions.chopAt(state, p);
      drag.travel = 0;
    } else if (drag.kind === 'stove' && drag.angle !== null) {
      const a = angleToPan(p);
      let delta = a - drag.angle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      actions.stirAt(state, delta, p);
      drag.angle = a;
    }
    drag.x = p.x; drag.y = p.y;
  });

  const release = (e) => {
    if (!drag.active) return;
    const p = canvasPoint(canvas, e);
    if (drag.kind === 'stove' && drag.travel < 16) actions.flip(state, p);
    if (drag.kind === 'board' && drag.travel > 0) actions.chopAt(state, p);
    drag.active = false; drag.kind = 'none'; drag.angle = null;
    state.pointer.down = false;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => {
    state.pointer.x = -100; state.pointer.y = -100; state.pointer.region = 'none';
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      actions.selectTicketAt(state, Number(e.key) - 1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      actions.flip(state, null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      actions.serve(state);
    } else if (e.key.toLowerCase() === 'r') {
      if (hooks.onRestart) hooks.onRestart();
    }
  });
}
