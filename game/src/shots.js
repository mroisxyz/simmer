// Skyline Courier - frozen, deterministic views used for the contact sheet.
// Each preset keeps the real renderer and HUD; only the flight state is posed.

const PRESETS = {
  cruise: {
    mission: 0,
    time: 12.4,
    timeOfDay: 'day',
    plane: { x: -180, y: 330, z: 900, hdg: 0.05, pitch: 0.02, roll: 0.16, spd: 95, vs: 2, throttle: 0.72, gear: false, fuel: 82, damage: 4 }
  },
  approach: {
    mission: 1,
    time: 41.8,
    timeOfDay: 'day',
    plane: { x: -18, y: 168, z: 40, hdg: -0.015, pitch: -0.035, roll: 0.04, spd: 74, vs: -3.4, throttle: 0.34, gear: true, fuel: 64, damage: 2 }
  },
  rings: {
    mission: 0,
    time: 73.2,
    timeOfDay: 'day',
    plane: { x: 120, y: 275, z: 2150, hdg: -0.06, pitch: 0.075, roll: -0.26, spd: 102, vs: 5, throttle: 0.86, gear: false, fuel: 71, damage: 0 }
  },
  dusk: {
    mission: 2,
    time: 108.6,
    timeOfDay: 'dusk',
    plane: { x: -260, y: 300, z: 620, hdg: 0.1, pitch: -0.01, roll: 0.13, spd: 86, vs: -1, throttle: 0.6, gear: true, fuel: 48, damage: 11 }
  }
};

export const SHOT_NAMES = Object.keys(PRESETS);

export function applyShot(state, query) {
  const name = query instanceof URLSearchParams ? query.get('shot') : null;
  const preset = name && PRESETS[name] ? PRESETS[name] : null;
  if (!preset) return state;
  Object.assign(state.plane, preset.plane);
  state.plane.stall = false;
  state.plane.landed = false;
  state.plane.crashed = false;
  state.plane.gearWarn = 0;
  state.missionIndex = preset.mission;
  state.mission.ringsPassed = 0;
  state.mission.townReached = false;
  state.mission.complete = false;
  state.time = preset.time;
  state.timeOfDay = preset.timeOfDay;
  state.message = '';
  state.messageTimer = 0;
  state.frozen = true;
  return state;
}
