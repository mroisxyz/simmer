// Skyline Courier - boot, fixed-step loop and module wiring.
import { CANVAS, STEP } from './config.js';
import { createState, resetFlight, setMission } from './state.js';
import { updateFlight } from './physics.js';
import { createInput, readInput } from './input.js';
import { drawSky, drawTerrain, drawRunway, drawTargetRings, makeView } from './scenery.js';
import { drawAircraft } from './aircraft.js';
import { drawPanel, drawHUD } from './instruments.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const query = new URLSearchParams(window.location.search);
const seedValue = Number(query.get('seed'));
const seed = Number.isFinite(seedValue) && query.has('seed') ? Math.floor(seedValue) : 11;
const state = createState(seed);
applyShot(state, query);
const input = createInput(canvas);

function applyControls(controls) {
  const p = state.plane;
  if (controls.gearToggle) p.gear = !p.gear;
  if (controls.restart) resetFlight(state);
  if (controls.mission >= 0) setMission(state, controls.mission);
  updateFlight(state, controls, STEP);
}

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS.W, CANVAS.H);
  const view = makeView(state);
  drawSky(ctx, state, view);
  ctx.save();
  ctx.translate(CANVAS.CX, CANVAS.CY);
  ctx.rotate(-state.plane.roll * 0.55);
  ctx.translate(-CANVAS.CX, -CANVAS.CY);
  drawTerrain(ctx, state, view);
  drawRunway(ctx, state, view);
  drawTargetRings(ctx, state, view);
  ctx.restore();
  drawAircraft(ctx, state, view);
  drawPanel(ctx, state);
  drawHUD(ctx, state, view);
}

let lastFrame = 0;
let accumulator = 0;
function frame(now) {
  if (!state.frozen) {
    const elapsed = lastFrame ? Math.min(0.12, (now - lastFrame) / 1000) : STEP;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      applyControls(readInput(input));
      accumulator -= STEP;
    }
  }
  lastFrame = now;
  render();
  window.__skylineReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A small hook for automated capture; gameplay never depends on it.
window.__skyline = { state, render };
