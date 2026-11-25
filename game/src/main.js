// main.js — boot only: read the URL, build the state, wire input, run the frame loop.
// A ?shot=... URL freezes time so a preset frame can be captured byte-for-byte.

import { createState, advanceTimers } from './state.js';
import { applyShot } from './shots.js';
import { attachInput } from './input.js';
import * as actions from './actions.js';
import { render } from './render.js';

const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

const state = createState(seed);
applyShot(state, params);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

attachInput(canvas, state, actions, {
  onRestart: () => {
    Object.assign(state, createState(seed));
    applyShot(state, params);
  },
});

const frozen = params.has('shot');
let lastFrame = 0;

function frame(now) {
  if (!lastFrame) lastFrame = now;
  const dt = frozen ? 0 : Math.min(120, now - lastFrame);
  lastFrame = now;
  advanceTimers(state, dt);
  render(ctx, state);
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
