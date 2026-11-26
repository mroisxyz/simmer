// Skyline Courier - deterministic state and scenery generation.
import { AIRCRAFT, MISSIONS, WORLD } from './config.js';

// Small, fast seeded generator: identical scenery on every machine.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function range(rnd, low, high) {
  return low + (high - low) * rnd();
}

// The river meanders gently around the airfield; scenery and physics share it.
export function riverCenterX(z, scenery) {
  return 470 + 250 * Math.sin(z / 870 + scenery.riverPhase) - z * 0.055;
}

function buildScenery(seed) {
  const rnd = makeRandom(seed);
  const scenery = { seed, riverPhase: rnd() * 6.283, hills: [], trees: [], houses: [], clouds: [] };
  const bands = [
    { count: 26, z0: -1200, z1: 6400, h0: 260, h1: 620, w0: 700, w1: 1500, key: 'far' },
    { count: 24, z0: -1000, z1: 4500, h0: 170, h1: 430, w0: 450, w1: 1000, key: 'mid' },
    { count: 22, z0: -1200, z1: 2800, h0: 90, h1: 260, w0: 300, w1: 760, key: 'near' }
  ];
  for (const band of bands) {
    for (let i = 0; i < band.count; i++) {
      scenery.hills.push({
        x: range(rnd, -4200, 4200),
        z: range(rnd, band.z0, band.z1),
        h: range(rnd, band.h0, band.h1),
        w: range(rnd, band.w0, band.w1),
        key: band.key,
        tone: rnd()
      });
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = range(rnd, -3000, 3000);
    const z = range(rnd, -1200, 6100);
    const river = riverCenterX(z, scenery);
    if (Math.abs(x) < 150 && z > 300 && z < 2500) continue; // keep the runway clear
    if (Math.abs(x - river) < 130) continue; // and the river banks
    scenery.trees.push({ x, z, h: range(rnd, 26, 62), tone: rnd() });
  }
  for (const town of WORLD.towns) {
    scenery.houses.push({ x: town.x, z: town.z, name: town.name, w: 0, h: 0, roof: 0 });
    for (let i = 0; i < 18; i++) {
      const a = rnd() * 6.283;
      const r = Math.sqrt(rnd()) * 210;
      scenery.houses.push({
        x: town.x + Math.cos(a) * r,
        z: town.z + Math.sin(a) * r,
        w: range(rnd, 16, 34),
        h: range(rnd, 18, 38),
        roof: rnd(),
        name: ''
      });
    }
  }
  for (let i = 0; i < 16; i++) {
    scenery.clouds.push({
      x: range(rnd, -3400, 3400),
      y: range(rnd, 820, 1900),
      z: range(rnd, -1200, 6800),
      w: range(rnd, 110, 260),
      tone: rnd()
    });
  }
  return scenery;
}

function freshPlane() {
  return {
    x: 0, y: 250, z: 120,
    hdg: 0, pitch: 0.015, roll: 0,
    spd: 88, vs: 0, throttle: 0.68,
    gear: false, fuel: AIRCRAFT.fuelCapacity, damage: 0,
    stall: false, landed: false, crashed: false, gearWarn: 0
  };
}

export function createState(seed = 11) {
  const scenery = buildScenery(seed >>> 0);
  return {
    seed: seed >>> 0,
    scenery,
    time: 0,
    frozen: false,
    timeOfDay: 'day',
    missionIndex: 0,
    mission: {
      ringsPassed: 0,
      townReached: false,
      complete: false,
      startFuel: AIRCRAFT.fuelCapacity
    },
    plane: freshPlane(),
    message: 'Skyline Courier - delivery board ready',
    messageTimer: 5,
    score: 0
  };
}

export function setMission(state, index) {
  const i = Math.max(0, Math.min(MISSIONS.length - 1, index | 0));
  state.missionIndex = i;
  state.mission.ringsPassed = 0;
  state.mission.townReached = false;
  state.mission.complete = false;
  state.mission.startFuel = state.plane.fuel;
  state.plane.landed = false;
  state.plane.crashed = false;
  state.message = MISSIONS[i].brief;
  state.messageTimer = 6;
}

export function resetFlight(state) {
  state.plane = freshPlane();
  state.time = 0;
  state.mission.ringsPassed = 0;
  state.mission.townReached = false;
  state.mission.complete = false;
  state.mission.startFuel = AIRCRAFT.fuelCapacity;
  state.message = MISSIONS[state.missionIndex].brief;
  state.messageTimer = 5;
}

export function currentRing(state) {
  const rings = WORLD.rings;
  const i = state.mission.ringsPassed;
  return i < rings.length ? rings[i] : null;
}
