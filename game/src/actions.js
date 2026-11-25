// actions.js — the verb layer. Each click, chop, stir and flip changes the dish
// and fires an immediate particle/flash/toast so the input never feels silent.

import { LAYOUT, TIMER, PALETTE, ingredientById } from './config.js';
import { random, randomInt, setToast, beginDish, currentStep, finishStep,
  selectedOrder, selectTicket, scoreOrder } from './state.js';

const boardCenter = () => ({ x: LAYOUT.board.x + LAYOUT.board.w / 2, y: LAYOUT.board.y + 82 });
const panCenter = () => ({ x: LAYOUT.stove.x + 104, y: LAYOUT.stove.y + 92 });
const plateCenter = () => ({ x: LAYOUT.plate.x + LAYOUT.plate.w / 2, y: LAYOUT.plate.y + LAYOUT.plate.h / 2 });

// The six bins follow the active dish, then the other tickets, then pantry staples.
export function binIds(state) {
  const target = state.active || selectedOrder(state);
  const ids = target ? target.items.slice() : [];
  for (const order of state.orders) {
    for (const id of order.items) if (ids.length < 6 && !ids.includes(id)) ids.push(id);
  }
  for (const id of ['yolk', 'tomato', 'noodle', 'berry', 'carrot', 'rice', 'lemon', 'shrimp']) {
    if (ids.length < 6 && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 6);
}

export function emitBurst(state, x, y, colors, count = 8, power = 130) {
  for (let i = 0; i < count; i++) {
    const a = random(state) * Math.PI * 2;
    const speed = power * (0.4 + random(state) * 0.9);
    const c = colors[randomInt(state, colors.length)];
    state.particles.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 60,
      color: c, size: 4 + random(state) * 5, shape: 'bit',
      life: TIMER.particleLifeMs, maxLife: TIMER.particleLifeMs,
      spin: random(state) * 6, spinRate: (random(state) - 0.5) * 14,
    });
  }
}

export function emitFlash(state, x, y, color, radius = 44) {
  state.flashes.push({ x, y, r: radius, color, life: TIMER.flashMs, maxLife: TIMER.flashMs });
}

function warn(state, text) {
  if (state.toast && state.toast.until > state.now + 600 && state.toast.text === text) return;
  setToast(state, text, '#F6B35C');
}

export function pickIngredient(state, index, point) {
  const id = binIds(state)[index];
  if (!id) return;
  const ingredient = ingredientById(id);
  if (!state.active) {
    const order = selectedOrder(state);
    if (!order) return warn(state, 'NO TICKET!');
    beginDish(state, order);
  }
  const dish = state.active;
  if (dish.picked.length >= dish.items.length) return warn(state, 'ALL IN — COOK IT!');
  if (dish.items[dish.picked.length] !== id) {
    emitFlash(state, point.x, point.y, PALETTE.red, 36);
    state.combo = 0;
    return setToast(state, 'WRONG BIN', '#D8483C');
  }
  dish.picked.push(id);
  emitBurst(state, point.x, point.y, [ingredient.color, ingredient.accent, PALETTE.cream], 9, 150);
  emitFlash(state, point.x, point.y, ingredient.color, 40);
  setToast(state, ingredient.name.toUpperCase() + ' IN', ingredient.color);
  if (dish.picked.length === dish.items.length) setToast(state, 'PAN TIME!', '#F3C44E');
}

export function chopAt(state, point) {
  const dish = state.active;
  if (!dish) return warn(state, 'PICK A TICKET FIRST');
  const step = currentStep(dish);
  if (step !== 'chop') return warn(state, step === 'pick' ? 'PICK INGREDIENTS FIRST' : 'NO CHOP NEEDED');
  const c = boardCenter();
  const colors = dish.picked.map((id) => ingredientById(id)).flatMap((i) => [i.color, i.accent]);
  dish.progress.chop++;
  state.chopStreak++;
  emitBurst(state, point.x, point.y, colors, 7, 175);
  emitFlash(state, c.x, c.y, PALETTE.orangeLight, 38);
  if (dish.progress.chop >= TIMER.chopGoal) {
    emitBurst(state, c.x, c.y, colors, 16, 230);
    finishStep(state);
    setToast(state, 'CHOPPED!', '#6BC8AE');
  } else {
    setToast(state, 'CHOP ' + dish.progress.chop + '/' + TIMER.chopGoal, PALETTE.gold);
  }
}

export function stirAt(state, delta, point) {
  const dish = state.active;
  if (!dish || currentStep(dish) !== 'stir') return warn(state, 'NOT STIRRING TIME');
  state.stirArc += Math.abs(delta);
  if (state.stirArc < 0.85) return;
  state.stirArc -= 0.85;
  const c = panCenter();
  const colors = dish.picked.map((id) => ingredientById(id)).flatMap((i) => [i.color, i.accent]);
  dish.progress.stir++;
  emitBurst(state, point ? point.x : c.x, point ? point.y : c.y, colors, 6, 110);
  emitFlash(state, c.x, c.y, PALETTE.tealLight, 50);
  if (dish.progress.stir >= TIMER.stirGoal) {
    emitBurst(state, c.x, c.y, colors, 18, 200);
    finishStep(state);
    setToast(state, 'STIRRED!', '#6BC8AE');
  } else {
    setToast(state, 'STIR ' + dish.progress.stir + '/' + TIMER.stirGoal, PALETTE.tealLight);
  }
}

export function flip(state, point) {
  const dish = state.active;
  if (!dish || currentStep(dish) !== 'flip') return warn(state, 'NO FLIP NEEDED');
  const c = panCenter();
  const colors = dish.picked.map((id) => ingredientById(id)).flatMap((i) => [i.color, i.accent]);
  dish.progress.flip++;
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x: c.x + (random(state) - 0.5) * 90, y: c.y + (random(state) - 0.5) * 30,
      vx: (random(state) - 0.5) * 90, vy: -260 - random(state) * 140,
      color: colors[randomInt(state, colors.length)], size: 5 + random(state) * 6, shape: 'bit',
      life: TIMER.particleLifeMs, maxLife: TIMER.particleLifeMs, spin: 0, spinRate: 8,
    });
  }
  emitFlash(state, c.x, c.y, PALETTE.orange, 66);
  if (dish.progress.flip >= TIMER.flipGoal) {
    finishStep(state);
    setToast(state, 'FLIPPED!', '#6BC8AE');
  } else {
    setToast(state, 'FLIP ' + dish.progress.flip + '/' + TIMER.flipGoal, PALETTE.gold);
  }
}

export function panPress(state, point) {
  const dish = state.active;
  if (!dish) return warn(state, 'PICK A TICKET FIRST');
  if (currentStep(dish) === 'flip') return flip(state, point);
  if (currentStep(dish) === 'stir') return warn(state, 'STIR IN CIRCLES');
  warn(state, 'PAN IS WAITING');
}

export function plate(state) {
  const dish = state.active;
  if (!dish || currentStep(dish) !== 'plate') return warn(state, 'FINISH THE PAN FIRST');
  const c = plateCenter();
  state.plated = {
    orderId: dish.orderId, recipeId: dish.recipeId, name: dish.name,
    items: dish.items.slice(), color: dish.color,
  };
  state.active = null;
  emitBurst(state, c.x, c.y, [PALETTE.cream, PALETTE.gold, dish.color], 20, 170);
  emitFlash(state, c.x, c.y, PALETTE.gold, 70);
  setToast(state, 'PLATED — CLICK TO SERVE', PALETTE.gold);
}

export function plateClick(state, point) {
  if (state.plated) return serve(state);
  plate(state, point);
}

export function serve(state) {
  const dish = state.plated;
  if (!dish) return warn(state, 'NOTHING TO SERVE');
  const order = state.orders.find((o) => o.id === dish.orderId);
  const c = plateCenter();
  if (!order) {
    state.plated = null;
    state.combo = 0;
    state.satisfaction = Math.max(0, state.satisfaction - 16);
    state.shake = 340;
    state.expiryFlash = 420;
    emitBurst(state, c.x, c.y, [PALETTE.red, PALETTE.ink], 14, 150);
    emitFlash(state, c.x, c.y, PALETTE.red, 60);
    return setToast(state, 'WRONG DISH — SATISFACTION DOWN', '#D8483C');
  }
  const ratio = Math.max(0, order.remaining / order.total);
  const gained = scoreOrder(state, order, ratio);
  state.plated = null;
  state.satisfaction = Math.min(100, state.satisfaction + 12 + Math.round(ratio * 8));
  emitBurst(state, c.x, c.y, [PALETTE.gold, PALETTE.cream, dish.color, '#F29CB5'], 26, 210);
  emitFlash(state, c.x, c.y, PALETTE.gold, 88);
  setToast(state, 'SERVED +' + gained, PALETTE.gold);
}

export function selectTicketAt(state, index) {
  if (index >= 0 && index < state.orders.length) selectTicket(state, index);
}
