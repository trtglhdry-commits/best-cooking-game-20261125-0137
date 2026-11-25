// Sizzle & Serve — configuration: dishes, ingredients, tuning, layout.
// One clear job: every number the game balances on lives here, so tuning
// never hides inside the cooking or drawing code.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const HAND_MAX = 3;

export const CHOP_SECONDS = 1.4;
export const WOK_SECONDS = 3.2;
export const GRILL_SECONDS = 3.6;
export const BURN_SECONDS = 9;

// Ingredient catalogue. `chop` means the raw item must visit the chopping
// board before it can be cooked; `icon` is the glyph drawn on its bin.
export const INGREDIENTS = {
  rice:    { name: 'Rice',    icon: '🍚', color: '#f5ecd7', chop: false },
  noodle:  { name: 'Noodle',  icon: '🍜', color: '#f2c14e', chop: false },
  egg:     { name: 'Egg',     icon: '🥚', color: '#fdf6d8', chop: false },
  chicken: { name: 'Chicken', icon: '🍗', color: '#e8a87c', chop: true },
  chili:   { name: 'Chili',   icon: '🌶️', color: '#d64545', chop: true },
  veggie:  { name: 'Veggie',  icon: '🥬', color: '#7bc47f', chop: true },
  tea:     { name: 'Tea',     icon: '🍵', color: '#b5651d', chop: false },
  ice:     { name: 'Ice',     icon: '🧊', color: '#a8d8ea', chop: false },
  sauce:   { name: 'Sauce',   icon: '🥜', color: '#8b5a2b', chop: false },
};

// A chopped item is the same ingredient with a `chopped` flag; its display
// name and icon gain a knife mark so the player can tell it apart.
export function choppedName(id) {
  return `Chopped ${INGREDIENTS[id].name}`;
}

// Recipes. `wok` / `grill` list the items the station must hold (chopped
// items written as `chopped:<id>`); `plate` lists extras added on the plate
// after the cooked base; `drink` dishes are mixed at the drink station.
export const RECIPES = {
  'nasi-goreng': {
    name: 'Nasi Goreng', icon: '🍚', price: 18, station: 'wok',
    wok: ['rice', 'egg', 'chopped:chili'], plate: [],
    blurb: 'Rice, egg, chili',
  },
  'mie-goreng': {
    name: 'Mie Goreng', icon: '🍜', price: 22, station: 'wok',
    wok: ['noodle', 'chopped:chicken', 'chopped:veggie'], plate: [],
    blurb: 'Noodles, chicken, greens',
  },
  'sate-ayam': {
    name: 'Sate Ayam', icon: '🍢', price: 20, station: 'grill',
    grill: ['chopped:chicken'], plate: ['sauce'],
    blurb: 'Chicken skewers, sauce',
  },
  'es-teh': {
    name: 'Es Teh', icon: '🧋', price: 8, station: 'drink',
    drink: ['tea', 'ice'], plate: [],
    blurb: 'Sweet iced tea',
  },
};

export const RECIPE_IDS = Object.keys(RECIPES);

// Order pacing: a new ticket every `spawnEvery` seconds, shrinking as the
// shift goes on; patience is how long a ticket waits before walking out.
export function spawnEvery(elapsedSeconds) {
  const t = elapsedSeconds / SHIFT_SECONDS;
  return 15 - 8 * t; // 15s at open, 7s by closing
}
export function orderPatience(elapsedSeconds) {
  const t = elapsedSeconds / SHIFT_SECONDS;
  return 52 - 14 * t; // 52s early, 38s late
}
export function maxOrders(elapsedSeconds) {
  return elapsedSeconds < 60 ? 3 : 4;
}

// Serving: tip scales with patience left; a serve within COMBO_WINDOW of
// the last one raises the combo, which multiplies the tip.
export const COMBO_WINDOW = 10;
export const COMBO_MAX = 3;

// Layout rectangles, in logical 1280x720 space. The order board lives on
// top; the stations sit on the counter; the bins line the bottom.
export const LAYOUT = {
  board: { x: 16, y: 12, w: 760, h: 92 },
  timer: { x: 792, y: 12, w: 220, h: 92 },
  score: { x: 1028, y: 12, w: 236, h: 92 },
  boardSlot: { w: 176, h: 80, gap: 12 },
  boardSlot0: { x: 28, y: 18 },
  counter: { x: 16, y: 128, w: 1248, h: 400 },
  board2: { x: 40, y: 170, w: 220, h: 220 },   // chopping board
  wok: { x: 300, y: 170, w: 220, h: 220 },
  grill: { x: 560, y: 170, w: 220, h: 220 },
  drink: { x: 820, y: 170, w: 200, h: 220 },
  plate: { x: 1060, y: 170, w: 180, h: 220 },
  trash: { x: 1140, y: 420, w: 100, h: 72 },
  bins: { x: 16, y: 552, w: 1248, h: 148 },
  bin: { w: 128, h: 128, gap: 10 },
  bin0: { x: 28, y: 562 },
  hand: { x: 16, y: 552, w: 0, h: 0 },
};

export const BIN_ORDER = ['rice', 'noodle', 'egg', 'chicken', 'chili', 'veggie', 'tea', 'ice', 'sauce'];

// Warm warung palette.
export const COLORS = {
  wall: '#f7e8c9',
  wallStripe: '#f2dcae',
  floor: '#c98f5f',
  floorTile: '#b57a4e',
  counterTop: '#8a5a33',
  counterFront: '#6f4525',
  boardWood: '#d9a066',
  steel: '#9aa5ad',
  steelDark: '#6e7a82',
  wok: '#3a3f44',
  flame: '#ff9f1c',
  flameCore: '#ffd23f',
  plateWhite: '#fdfdf6',
  ink: '#2b2118',
  inkSoft: '#6b5a44',
  ticket: '#fff8e1',
  ticketLate: '#ffe0b2',
  ticketAngry: '#ffc4b3',
  good: '#2e9e5b',
  bad: '#d64545',
  gold: '#f2b705',
};
