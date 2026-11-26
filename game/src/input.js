// Skyline Courier - keyboard and pointer controls, sampled once per frame.
import { clamp } from './physics.js';

const FLIGHT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
  'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'Space'
]);

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pointer: { active: false, x: 0, y: 0 },
    gearToggle: false,
    restart: false,
    mission: -1
  };

  window.addEventListener('keydown', (event) => {
    if (FLIGHT_KEYS.has(event.code)) event.preventDefault();
    if (!input.keys.has(event.code)) {
      if (event.code === 'Space') input.gearToggle = true;
      if (event.code === 'KeyR') input.restart = true;
      if (event.code === 'Digit1') input.mission = 0;
      if (event.code === 'Digit2') input.mission = 1;
      if (event.code === 'Digit3') input.mission = 2;
    }
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => input.keys.delete(event.code));
  window.addEventListener('blur', () => input.keys.clear());

  const aim = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.pointer.x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    input.pointer.y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  };
  canvas.addEventListener('pointerdown', (event) => {
    input.pointer.active = true;
    aim(event);
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (input.pointer.active) aim(event);
  });
  canvas.addEventListener('pointerup', () => { input.pointer.active = false; });
  canvas.addEventListener('pointercancel', () => { input.pointer.active = false; });
  return input;
}

// Returns a plain control frame. One-shot flags are consumed by this call.
export function readInput(input) {
  const k = input.keys;
  const held = (a, b) => (k.has(a) || k.has(b) ? 1 : 0);
  let pitch = held('ArrowUp', 'KeyW') - held('ArrowDown', 'KeyS');
  let roll = held('ArrowRight', 'KeyD') - held('ArrowLeft', 'KeyA');
  if (input.pointer.active) {
    pitch = clamp(-input.pointer.y * 1.4, -1, 1);
    roll = clamp(input.pointer.x * 1.4, -1, 1);
  }
  const controls = {
    pitch,
    roll,
    yaw: held('KeyE') - held('KeyQ'),
    throttleStep: held('ShiftLeft', 'ShiftRight') - held('ControlLeft', 'ControlRight'),
    gearToggle: input.gearToggle,
    restart: input.restart,
    mission: input.mission
  };
  input.gearToggle = false;
  input.restart = false;
  input.mission = -1;
  return controls;
}
