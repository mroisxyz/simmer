// shots.js — reproducible camera presets. Each one is a normal in-game moment
// (never a menu): dishes, tickets, timers and particles are staged from the seed.

import { TIMER, PALETTE, ingredientById } from './config.js';
import { addOrder, advanceTimers } from './state.js';
import { emitBurst, emitFlash } from './actions.js';

function orderById(state, id) {
  return state.orders.find((o) => o.id === id);
}

function stageActive(state, order, stepIndex, counts) {
  if (!order) return;
  const countsDefault = { chop: TIMER.chopGoal, stir: TIMER.stirGoal, flip: TIMER.flipGoal, plate: 0 };
  const progress = Object.assign(countsDefault, counts || {});
  state.active = {
    orderId: order.id, recipeId: order.recipeId, name: order.name, color: order.color,
    items: order.items.slice(), steps: order.steps.slice(), picked: order.items.slice(),
    stepIndex, progress, elapsed: 4200,
  };
}

function stagePlate(state, order) {
  if (!order) return;
  state.plated = { orderId: order.id, recipeId: order.recipeId, name: order.name,
    items: order.items.slice(), color: order.color };
}

function fillBoard(state) {
  while (state.orders.length < 3) addOrder(state);
}

function flavor(state, x, y, ids, count, power) {
  const colors = ids.flatMap((id) => {
    const ing = ingredientById(id);
    return ing ? [ing.color, ing.accent] : [PALETTE.gold];
  });
  emitBurst(state, x, y, colors, count, power);
}

export function applyShot(state, query) {
  const q = typeof query === 'string' ? new URLSearchParams(query.replace(/^\?/, '')) : query;
  const shot = q && q.get ? (q.get('shot') || 'kitchen') : 'kitchen';
  state.shotName = shot;
  fillBoard(state);

  if (shot === 'kitchen') {
    advanceTimers(state, 900);
    const panOrder = orderById(state, 1);
    const serveOrder = orderById(state, 2);
    stageActive(state, panOrder, 1, { stir: 3 });
    stagePlate(state, serveOrder);
    state.selected = 0;
    flavor(state, 476, 482, panOrder.items, 12, 120);
    flavor(state, 770, 486, serveOrder.items, 14, 150);
    emitFlash(state, 770, 486, PALETTE.gold, 72);
    state.toast = { text: 'PLATED — CLICK TO SERVE', color: PALETTE.gold,
      until: state.now + 4000 };
    state.rush = 46;
  } else if (shot === 'prep') {
    advanceTimers(state, 700);
    const order = orderById(state, 1);
    stageActive(state, order, 0, { chop: 3, stir: 0, flip: 0 });
    state.selected = 0;
    state.pointer = { x: 196, y: 470, down: true, region: 'board' };
    state.chopStreak = 3;
    flavor(state, 196, 470, order.items, 22, 240);
    emitFlash(state, 196, 470, PALETTE.orangeLight, 60);
    state.toast = { text: 'CHOP 3/' + TIMER.chopGoal, color: PALETTE.gold,
      until: state.now + 4000 };
    if (state.orders[1]) state.orders[1].remaining = Math.round(state.orders[1].total * 0.72);
  } else if (shot === 'assembly') {
    advanceTimers(state, 600);
    const order = orderById(state, 2);
    stageActive(state, order, 1, { stir: 4, flip: 0 });
    state.orders.forEach((o, i) => { o.remaining = Math.round(o.total * (i === 1 ? 0.58 : 0.8)); });
    state.selected = 1;
    state.stirArc = 0.4;
    flavor(state, 476, 482, order.items, 16, 110);
    emitFlash(state, 476, 482, PALETTE.tealLight, 64);
    state.toast = { text: 'STIR 4/' + TIMER.stirGoal, color: PALETTE.tealLight,
      until: state.now + 4000 };
    state.rush = 54;
  } else if (shot === 'service') {
    advanceTimers(state, 1200);
    const order = orderById(state, 1);
    stagePlate(state, order);
    state.selected = 0;
    state.orders.forEach((o, i) => { o.remaining = Math.round(o.total * (i === 0 ? 0.16 : 0.44)); });
    state.score = 1285;
    state.served = 6;
    state.combo = 4;
    state.bestCombo = 5;
    state.rush = 83;
    flavor(state, 770, 486, order.items, 26, 200);
    emitFlash(state, 770, 486, PALETTE.gold, 92);
    state.lastServe = { points: 315, name: order.name, until: state.now + 4000 };
    state.toast = { text: 'SERVED +315', color: PALETTE.gold, until: state.now + 4000 };
  }
  return state;
}
