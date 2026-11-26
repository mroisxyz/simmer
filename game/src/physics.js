// Skyline Courier - flight model, ground contact and mission triggers.
import { AIRCRAFT, MISSIONS, WORLD } from './config.js';
import { currentRing } from './state.js';

export function clamp(v, low, high) {
  return v < low ? low : v > high ? high : v;
}

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function judgeGroundContact(state) {
  const p = state.plane;
  const rw = WORLD.runway;
  const onStrip = Math.abs(p.x - rw.x) < rw.width / 2 + 8 && p.z > rw.z0 - 60 && p.z < rw.z1 + 60;
  const aligned = Math.abs(wrapAngle(p.hdg)) < AIRCRAFT.landingHeading && Math.abs(p.roll) < AIRCRAFT.landingRoll;
  const gentle = -p.vs <= AIRCRAFT.landingDescent && p.spd <= AIRCRAFT.landingSpeed;
  p.y = 0;
  p.vs = 0;
  if (onStrip && aligned && gentle && p.gear) {
    p.landed = true;
    p.spd *= 0.3;
    state.score += 500;
    state.message = 'Smooth touchdown - runway delivery logged.';
    state.messageTimer = 5;
    const kind = MISSIONS[state.missionIndex].kind;
    if (kind === 'landing' || (kind === 'fuel' && state.mission.townReached)) {
      state.mission.complete = true;
      state.score += 800;
      state.message = MISSIONS[state.missionIndex].done;
    }
  } else {
    p.crashed = true;
    p.damage = 100;
    p.spd = 0;
    state.message = !p.gear ? 'Gear up - the mail plane bellied in.' :
      !onStrip ? 'Off the runway - airframe lost.' :
        !aligned ? 'Crooked touchdown - wings struck the grass.' : 'Hard landing - airframe broken.';
    state.messageTimer = 6;
  }
}

function updateRingCourse(state, previousZ) {
  const ring = currentRing(state);
  if (!ring) return;
  const p = state.plane;
  if (previousZ <= ring.z && p.z > ring.z) {
    const t = (ring.z - previousZ) / Math.max(1, p.z - previousZ);
    const cx = p.x - Math.sin(p.hdg) * p.spd * (1 - t);
    const cy = p.y - p.vs * (1 - t);
    const miss = Math.hypot(cx - ring.x, cy - ring.y);
    if (miss < ring.radius) {
      state.mission.ringsPassed += 1;
      state.score += 350;
      state.message = `Beacon ${state.mission.ringsPassed} of ${WORLD.rings.length} cleared.`;
      state.messageTimer = 3;
      if (state.mission.ringsPassed >= WORLD.rings.length) {
        state.mission.complete = true;
        state.score += 600;
        state.message = MISSIONS[state.missionIndex].done;
      }
    } else {
      state.message = 'Beacon missed - come around for another pass.';
      state.messageTimer = 4;
    }
  }
}

function updateLongHaul(state) {
  const p = state.plane;
  const stop = WORLD.towns[1];
  if (!state.mission.townReached && Math.hypot(p.x - stop.x, p.z - stop.z) < 420 && p.y > 90) {
    state.mission.townReached = true;
    state.score += 400;
    state.message = 'Mail dropped at Alder Quay - return to Skyline Field.';
    state.messageTimer = 5;
  }
}

// One deterministic frame of flight. controls: pitch, roll, yaw, throttleStep.
export function updateFlight(state, controls, dt) {
  const p = state.plane;
  const a = AIRCRAFT;
  if (state.frozen || p.crashed || p.landed) return;
  const previousZ = p.z;

  p.throttle = clamp(p.throttle + (controls.throttleStep || 0) * 0.62 * dt, 0, 1);
  const engine = p.fuel > 0 ? 1 : 0;
  const power = Math.max(0.45, 1 - p.damage / 170);
  const thrust = a.thrust * p.throttle * engine * power;
  const drag = a.dragBase + a.dragQuadratic * p.spd * p.spd + (p.gear ? a.gearDrag : 0);

  const authority = clamp((p.spd - a.minSpeed) / (a.cruiseSpeed - a.minSpeed), 0.3, 1);
  p.pitch = clamp(p.pitch + controls.pitch * a.pitchRate * dt * authority, -a.pitchLimit, a.pitchLimit);
  if (controls.roll !== 0) {
    p.roll = clamp(p.roll + controls.roll * a.rollRate * dt * authority, -a.rollLimit, a.rollLimit);
  } else {
    p.roll -= p.roll * Math.min(1, a.levelRate * dt);
  }
  p.hdg = wrapAngle(p.hdg + Math.tan(p.roll) * a.turnRate * dt * clamp(p.spd / 85, 0.35, 1.25) + (controls.yaw || 0) * 0.45 * dt);

  p.spd = clamp(p.spd + (thrust - drag - 9.8 * Math.sin(p.pitch)) * dt, a.minSpeed, a.maxSpeed);
  p.stall = p.spd < a.stallSpeed || (p.pitch > 0.33 && p.spd < 72);
  const stallDepth = clamp((a.stallSpeed - p.spd) / (a.stallSpeed - a.minSpeed), 0, 1);
  const sink = p.stall ? a.sinkStall * stallDepth : 0;
  const targetVs = p.spd * Math.sin(p.pitch) - sink;
  p.vs += (targetVs - p.vs) * Math.min(1, a.climbResponse * dt);
  p.y += p.vs * dt;
  const horizontal = p.spd * Math.cos(p.pitch);
  p.x += Math.sin(p.hdg) * horizontal * dt;
  p.z += Math.cos(p.hdg) * horizontal * dt;

  if (p.fuel > 0) p.fuel = Math.max(0, p.fuel - (a.fuelIdle + p.throttle * a.fuelThrottle) * dt);
  if (p.stall && p.vs < -9) p.damage = Math.min(100, p.damage + 2.2 * dt);

  if (p.y <= WORLD.ground) {
    judgeGroundContact(state);
    return;
  }
  state.time += dt;
  if (MISSIONS[state.missionIndex].kind === 'rings') updateRingCourse(state, previousZ);
  if (MISSIONS[state.missionIndex].kind === 'fuel') updateLongHaul(state);
  if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - dt);
}
