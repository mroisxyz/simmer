// Skyline Courier - shared rules and dimensions. No randomness lives here.
// Revision 1: ring spacing and landing envelope tuned to the flight model.

export const CANVAS = { W: 1280, H: 720, HORIZON: 300, CX: 640, CY: 360 };

// One visual language: warm paper skies, ink-blue hills, honey-gold beacons.
export const PALETTE = {
  day: {
    skyTop: '#1b4f76', skyMid: '#5593b6', skyLow: '#e7c79a',
    sun: '#fff2cf', cloud: '#f8ead2', cloudShade: '#d8c6ad',
    hillFar: '#54768a', hillMid: '#3f6266', hillNear: '#2c4b46',
    ground: '#7c9a68', groundAlt: '#68905f', field: '#88a873',
    river: '#5fa6b8', riverEdge: '#a8d2d0', forest: '#24453c',
    town: '#efe0c2', roof: '#b46a51', detail: '#d9d0ae'
  },
  dusk: {
    skyTop: '#1a2347', skyMid: '#7c4a63', skyLow: '#f0a268',
    sun: '#ffd9a0', cloud: '#e7b5a2', cloudShade: '#9e6d7b',
    hillFar: '#4b466a', hillMid: '#383b58', hillNear: '#252c44',
    ground: '#5e6a63', groundAlt: '#536158', field: '#6c7765',
    river: '#8c7fa4', riverEdge: '#c2a5b4', forest: '#222e38',
    town: '#f2d3ad', roof: '#9b5260', detail: '#cfb69f'
  },
  hud: '#c8f5d8', hudDim: '#6bbf9a', warn: '#ff8f6b', gold: '#ffd271',
  panel: '#101923', panelEdge: '#3c5666', glass: '#0b2a33'
};

export const WORLD = {
  ground: 0,
  focal: 430,
  near: 26,
  viewDistance: 6200,
  camBack: 38,
  camUp: 9,
  runway: { x: 0, z0: 420, z1: 2380, width: 96 },
  field: { x: 0, z: 1400, radius: 2600 },
  // Golden delivery beacons, in world metres: x lateral, y altitude, z ahead.
  rings: [
    { x: -110, y: 290, z: 2900, radius: 105 },
    { x: 190, y: 350, z: 4050, radius: 98 },
    { x: -60, y: 250, z: 5250, radius: 92 }
  ],
  // Named mail stops for the long-haul run.
  towns: [
    { name: 'Fernholt', x: -820, z: 3300 },
    { name: 'Alder Quay', x: 700, z: 4700 },
    { name: 'Skyline Field', x: 0, z: 1400 }
  ]
};

export const AIRCRAFT = {
  stallSpeed: 44,
  cruiseSpeed: 92,
  maxSpeed: 148,
  minSpeed: 24,
  thrust: 26,
  dragBase: 0.55,
  dragQuadratic: 0.0021,
  gearDrag: 5.5,
  pitchRate: 0.78,
  rollRate: 1.75,
  levelRate: 0.42,
  turnRate: 0.78,
  pitchLimit: 0.48,
  rollLimit: 0.95,
  climbResponse: 2.2,
  sinkStall: 15,
  fuelCapacity: 100,
  fuelIdle: 0.1,
  fuelThrottle: 0.35,
  landingDescent: 4.2,
  landingSpeed: 84,
  landingHeading: 0.24,
  landingRoll: 0.3,
  wingSpan: 15
};

export const MISSIONS = [
  {
    id: 'rings',
    name: 'GOLDEN ROUTE',
    kind: 'rings',
    brief: 'Thread all three courier beacons over the valley.',
    done: 'Route complete - mail dropped on time.'
  },
  {
    id: 'landing',
    name: 'FIELD DELIVERY',
    kind: 'landing',
    brief: 'Gear down, wings level, land softly on runway 09.',
    done: 'Touchdown logged. Clean delivery.'
  },
  {
    id: 'fuel',
    name: 'LONG HAUL',
    kind: 'fuel',
    brief: 'Reach Alder Quay, then return and land before fuel runs dry.',
    done: 'Round trip complete with fuel to spare.'
  }
];

export const STEP = 1 / 60;
