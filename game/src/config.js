// config.js — every dial for the kitchen: warm palette, original dishes and bins,
// order/ticket timing, and the LAYOUT rectangles shared by drawing and hit-testing.

export const PALETTE = {
  night: '#241A16',
  wall: '#F1DEC0',
  wallLight: '#FBF0DE',
  grout: '#D9C09C',
  wood: '#C08A57',
  woodDark: '#8F5C36',
  woodLight: '#E1B27C',
  counter: '#E8C79A',
  ink: '#3C2519',
  inkSoft: '#7A5437',
  cream: '#FFF8E8',
  orange: '#E8672E',
  orangeLight: '#FF9A4D',
  teal: '#2E8C7B',
  tealLight: '#6BC8AE',
  gold: '#F3C44E',
  red: '#D8483C',
  plate: '#FDFBF3',
  plateRim: '#D9D2C0',
  pan: '#3C444B',
  panHi: '#5B6670',
  ember: '#FF7A38',
  shadow: 'rgba(60,37,25,0.20)',
};

export const TIMER = {
  ticketMs: 32000,
  ticketMsEasy: 38000,
  orderIntervalMs: 11000,
  orderIntervalMinMs: 7000,
  chopGoal: 6,
  stirGoal: 7,
  flipGoal: 3,
  serveWindowMs: 1200,
  particleLifeMs: 620,
  flashMs: 320,
  rushRampPerSecond: 3.2,
};

export const ORDER_INTERVAL = TIMER.orderIntervalMs;

// Each ingredient owns a silhouette so the bins read like food, not colored dots.
export const INGREDIENTS = [
  { id: 'yolk', name: 'Sunny Yolk', color: '#FFC93C', accent: '#F0802E', shape: 'round' },
  { id: 'pepper', name: 'Crimson Pepper', color: '#E5484D', accent: '#9B1C31', shape: 'strip' },
  { id: 'tater', name: 'Golden Tater', color: '#E8B860', accent: '#B97B2E', shape: 'cube' },
  { id: 'noodle', name: 'River Noodle', color: '#F4D58D', accent: '#D9A441', shape: 'strip' },
  { id: 'scallion', name: 'Jade Scallion', color: '#5EC57E', accent: '#2E8B57', shape: 'strip' },
  { id: 'shrimp', name: 'Coral Shrimp', color: '#FF8B6B', accent: '#D95436', shape: 'ring' },
  { id: 'bun', name: 'Charcoal Bun', color: '#C98B52', accent: '#8B5A2B', shape: 'round' },
  { id: 'tomato', name: 'Fire Tomato', color: '#F2553F', accent: '#A32421', shape: 'round' },
  { id: 'crisp', name: 'Leafy Crisp', color: '#8FD14F', accent: '#4E8A2A', shape: 'leaf' },
  { id: 'flour', name: 'Cloud Flour', color: '#F5EFE1', accent: '#D9CDB6', shape: 'grain' },
  { id: 'berry', name: 'Berry Burst', color: '#C0468C', accent: '#7A225E', shape: 'round' },
  { id: 'honey', name: 'Honey Drip', color: '#F2A93B', accent: '#C77A17', shape: 'drop' },
  { id: 'rice', name: 'Pearl Rice', color: '#F7F2E8', accent: '#DCD2C0', shape: 'grain' },
  { id: 'seaweed', name: 'Seaweed Ribbon', color: '#2F6E5B', accent: '#173F36', shape: 'strip' },
  { id: 'sesame', name: 'Sesame Spark', color: '#EAD9A8', accent: '#B79A5B', shape: 'grain' },
  { id: 'carrot', name: 'Amber Carrot', color: '#F39C3D', accent: '#B9651F', shape: 'strip' },
  { id: 'onion', name: 'Violet Onion', color: '#B06BD6', accent: '#6E3C8C', shape: 'ring' },
  { id: 'bean', name: 'Green Bean', color: '#63B85A', accent: '#367A3B', shape: 'strip' },
  { id: 'chili', name: 'Comet Bean', color: '#D9603B', accent: '#8C341F', shape: 'round' },
  { id: 'ember', name: 'Ember Chili', color: '#EF3A2F', accent: '#9C1717', shape: 'strip' },
  { id: 'corn', name: 'Starseed Corn', color: '#FFD24A', accent: '#C99419', shape: 'grain' },
  { id: 'lemon', name: 'Zest Lemon', color: '#F6E14A', accent: '#C1A51B', shape: 'round' },
  { id: 'cream', name: 'Cream Swirl', color: '#FFF6E6', accent: '#E4D5B7', shape: 'drop' },
  { id: 'sugar', name: 'Sugar Snow', color: '#FFFFFF', accent: '#CFDBE4', shape: 'grain' },
];

// steps run left to right; a plate finishes the dish and unlocks Serve.
export const RECIPES = [
  { id: 'sunrise', name: 'Sunrise Skillet', color: '#E8672E', worth: 120,
    items: ['yolk', 'pepper', 'tater'], steps: ['chop', 'stir', 'flip', 'plate'] },
  { id: 'harbor', name: 'Harbor Noodle Bowl', color: '#2E8C7B', worth: 135,
    items: ['noodle', 'scallion', 'shrimp'], steps: ['chop', 'stir', 'plate'] },
  { id: 'slider', name: 'Ember Garden Sliders', color: '#B9651F', worth: 140,
    items: ['bun', 'tomato', 'crisp'], steps: ['chop', 'flip', 'plate'] },
  { id: 'cloud', name: 'Cloud Berry Pancakes', color: '#C0468C', worth: 150,
    items: ['flour', 'berry', 'honey'], steps: ['stir', 'flip', 'plate'] },
  { id: 'tidal', name: 'Tidal Rice Cake', color: '#2F6E5B', worth: 145,
    items: ['rice', 'seaweed', 'sesame'], steps: ['chop', 'stir', 'plate'] },
  { id: 'lantern', name: 'Lantern Veggie Skewer', color: '#F39C3D', worth: 130,
    items: ['carrot', 'onion', 'bean'], steps: ['chop', 'flip', 'plate'] },
  { id: 'meteor', name: 'Meteor Chili Pot', color: '#D9603B', worth: 155,
    items: ['chili', 'ember', 'corn'], steps: ['chop', 'stir', 'plate'] },
  { id: 'citrus', name: 'Citrus Crepe Stack', color: '#C1A51B', worth: 160,
    items: ['lemon', 'cream', 'sugar'], steps: ['stir', 'flip', 'plate'] },
];

export const LAYOUT = {
  width: 1280,
  height: 720,
  wallBottom: 244,
  counterTop: 262,
  bins: { x: 34, y: 272, w: 130, h: 104, gap: 10 },
  board: { x: 60, y: 398, w: 286, h: 186 },
  stove: { x: 372, y: 390, w: 286, h: 196 },
  plate: { x: 684, y: 400, w: 172, h: 172 },
  order: { x: 924, y: 86, w: 332, h: 508 },
  ticket: { x: 940, y: 104, w: 300, h: 148, gap: 12 },
  hud: { y: 0, h: 62 },
  footer: { y: 608, h: 112 },
};

export const ingredientById = (id) => INGREDIENTS.find((i) => i.id === id);
export const recipeById = (id) => RECIPES.find((r) => r.id === id);
