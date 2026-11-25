// state.js — the simulation. No clocks, no Math.random: every order, timer and
// particle lifetime is driven by an explicit dt so a seed always replays the same shift.

import { RECIPES, TIMER } from './config.js';

export function makeRandom(seed) {
  let s = seed >>> 0;
  return function nextRandom() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const random = (state) => state.nextRandom();
export const randomInt = (state, n) => Math.floor(random(state) * n);

export function setToast(state, text, color = '#F3C44E') {
  state.toast = { text, color, until: state.now + 1500 };
}

export function addOrder(state, forcedId = null) {
  const pool = RECIPES.filter((r) => r.id !== state.lastRecipeId);
  const recipe = forcedId ? RECIPES.find((r) => r.id === forcedId) : pool[randomInt(state, pool.length)];
  const total = TIMER.ticketMs + Math.round(random(state) * 6000);
  const order = {
    id: state.nextOrderId++,
    recipeId: recipe.id,
    name: recipe.name,
    items: recipe.items.slice(),
    steps: recipe.steps.slice(),
    color: recipe.color,
    worth: recipe.worth,
    total,
    remaining: total,
  };
  state.orders.push(order);
  state.lastRecipeId = recipe.id;
  if (state.orders.length === 1) state.selected = 0;
  return order;
}

export function createState(seed = 7) {
  const state = {
    seed: seed >>> 0,
    nextRandom: makeRandom(seed),
    now: 0,
    orders: [],
    nextOrderId: 1,
    lastRecipeId: null,
    spawnIn: TIMER.orderIntervalMs,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    rush: 8,
    selected: 0,
    active: null,
    plated: null,
    particles: [],
    flashes: [],
    toast: null,
    stirArc: 0,
    stirLastAngle: null,
    chopStreak: 0,
    lastServe: null,
    shotName: '',
  };
  addOrder(state, 'sunrise');
  addOrder(state, 'harbor');
  return state;
}

export function selectedOrder(state) {
  return state.orders[state.selected] || state.orders[0] || null;
}

export function selectTicket(state, index) {
  if (index >= 0 && index < state.orders.length) {
    state.selected = index;
    setToast(state, 'TICKET ' + (index + 1) + ' SELECTED', '#6BC8AE');
  }
}

export function beginDish(state, order) {
  if (!order || state.active) return state.active;
  state.active = {
    orderId: order.id,
    recipeId: order.recipeId,
    name: order.name,
    color: order.color,
    items: order.items.slice(),
    steps: order.steps.slice(),
    picked: [],
    stepIndex: 0,
    progress: { chop: 0, stir: 0, flip: 0, plate: 0 },
    elapsed: 0,
  };
  return state.active;
}

export function currentStep(dish) {
  if (!dish) return null;
  if (dish.picked.length < dish.items.length) return 'pick';
  return dish.steps[dish.stepIndex] || 'plate';
}

export function finishStep(state) {
  const dish = state.active;
  if (!dish) return;
  dish.stepIndex++;
  state.stirArc = 0;
  state.stirLastAngle = null;
  setToast(state, 'STEP DONE', '#6BC8AE');
}

// Removes a served or expired order and keeps the ticket board compact.
export function dropOrder(state, orderId) {
  const index = state.orders.findIndex((o) => o.id === orderId);
  if (index < 0) return;
  state.orders.splice(index, 1);
  state.selected = Math.max(0, Math.min(state.selected, state.orders.length - 1));
}

export function scoreOrder(state, order, timeRatio) {
  if (!order) return 0;
  const speedBonus = Math.round(order.worth * 0.5 * Math.max(0, timeRatio));
  const comboBonus = state.combo * 25;
  const gained = order.worth + speedBonus + comboBonus;
  state.score += gained;
  state.served++;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.rush = Math.max(0, state.rush - 16);
  state.lastServe = { points: gained, name: order.name, until: state.now + 1500 };
  dropOrder(state, order.id);
  return gained;
}

export function advanceTimers(state, dtMs) {
  const dt = Math.max(0, Math.min(dtMs, 120));
  state.now += dt;

  for (let i = state.orders.length - 1; i >= 0; i--) {
    const order = state.orders[i];
    order.remaining -= dt;
    if (order.remaining <= 0) {
      state.orders.splice(i, 1);
      state.missed++;
      state.combo = 0;
      state.rush = Math.min(100, state.rush + 20);
      setToast(state, 'ORDER LOST!', '#D8483C');
    }
  }
  state.selected = Math.max(0, Math.min(state.selected, state.orders.length - 1));

  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (state.orders.length < 3) addOrder(state);
    const hurry = Math.round(state.rush * 24);
    state.spawnIn = Math.max(TIMER.orderIntervalMinMs, TIMER.orderIntervalMs - hurry) + randomInt(state, 2200);
  }

  state.rush = Math.min(100, state.rush + (dt / 1000) * TIMER.rushRampPerSecond);
  if (state.active) state.active.elapsed += dt;

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt / 1000;
    p.y += p.vy * dt / 1000;
    p.vy += 220 * dt / 1000;
    p.spin += p.spinRate * dt / 1000;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.flashes.length - 1; i >= 0; i--) {
    const f = state.flashes[i];
    f.life -= dt;
    if (f.life <= 0) state.flashes.splice(i, 1);
  }
  return state;
}
