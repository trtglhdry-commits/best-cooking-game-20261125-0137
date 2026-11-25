// Sizzle & Serve — the kitchen: hands, chopping board, wok, grill,
// drink station, plate and bin.
// One clear job: every rule about what the player can pick up, chop, cook,
// assemble and throw away. Rendering reads this state; it never mutates it.

import {
  HAND_MAX, INGREDIENTS, RECIPES, CHOP_SECONDS, WOK_SECONDS,
  GRILL_SECONDS, BURN_SECONDS,
} from './config.js';

// An item in the hand or on a station: { id, chopped, kind }.
// kind is 'ingredient' (raw), 'cooked' (a wok/grill base, not yet plated)
// or 'dish' (a finished dish ready to serve).
export function item(id, chopped = false, kind = 'ingredient') {
  return { id, chopped, kind };
}
export function itemKey(it) {
  return it.chopped ? `chopped:${it.id}` : it.id;
}
export function itemLabel(it) {
  if (it.kind !== 'ingredient') return RECIPES[it.id].name;
  const base = INGREDIENTS[it.id];
  return it.chopped ? `Chopped ${base.name}` : base.name;
}
export function itemIcon(it) {
  if (it.kind !== 'ingredient') return RECIPES[it.id].icon;
  return INGREDIENTS[it.id].icon;
}

function setMatches(haveKeys, wantKeys) {
  if (haveKeys.length !== wantKeys.length) return false;
  const have = [...haveKeys].sort();
  const want = [...wantKeys].sort();
  return have.every((k, i) => k === want[i]);
}

export class Kitchen {
  constructor() {
    this.hand = []; // up to HAND_MAX items
    this.board = null; // { item, progress } chopping, or null
    this.wok = { items: [], progress: 0, cooking: false, done: false, burnTimer: 0, dish: null };
    this.grill = { items: [], progress: 0, cooking: false, done: false, burnTimer: 0, dish: null };
    this.drink = { items: [] }; // tea + ice mix instantly
    this.plate = null; // a plated dish id ready to serve, or null
    this.plateBase = null; // cooked base waiting for its plate extras
    this.events = []; // one-frame notices for sound: 'chop','sizzle','ding','error','trash','serve'
  }

  reset() {
    this.hand = [];
    this.board = null;
    this.wok = { items: [], progress: 0, cooking: false, done: false, burnTimer: 0, dish: null };
    this.grill = { items: [], progress: 0, cooking: false, done: false, burnTimer: 0, dish: null };
    this.drink = { items: [] };
    this.plate = null;
    this.plateBase = null;
    this.events = [];
  }

  // ---- hand ----
  takeFromBin(id) {
    if (this.hand.length >= HAND_MAX) {
      this.events.push('error');
      return false;
    }
    this.hand.push(item(id));
    this.events.push('pickup');
    return true;
  }

  dropToTrash() {
    if (this.hand.length === 0) return false;
    this.hand.pop();
    this.events.push('trash');
    return true;
  }

  // ---- chopping board ----
  // Click the board: put a choppable item on it, or take a finished one off.
  clickBoard() {
    if (this.board) {
      if (this.board.progress >= 1) {
        this.hand.push(this.board.item);
        this.board = null;
        this.events.push('pickup');
        return 'took-chopped';
      }
      return 'still-chopping';
    }
    const idx = this.hand.findIndex((it) => INGREDIENTS[it.id].chop && !it.chopped);
    if (idx === -1) {
      this.events.push('error');
      return 'nothing-to-chop';
    }
    const [it] = this.hand.splice(idx, 1);
    this.board = { item: item(it.id, true), progress: 0 };
    this.events.push('chop');
    return 'chopping';
  }

  // ---- wok / grill ----
  // Click a cooker: add a hand item that belongs in a recipe, or take the
  // finished dish out. Returns a short status string for the UI.
  clickCooker(cooker, which) {
    if (cooker.done) {
      if (this.hand.length >= HAND_MAX) {
        this.events.push('error');
        return 'hands-full';
      }
      this.hand.push(item(cooker.dish, false, 'cooked'));
      cooker.dish = null;
      cooker.done = false;
      cooker.items = [];
      cooker.progress = 0;
      cooker.cooking = false;
      this.events.push('pickup');
      return 'took-dish';
    }
    // Find a hand item this cooker can still use.
    const idx = this.hand.findIndex((it) => this.cookerWants(cooker, which, it));
    if (idx === -1) {
      this.events.push('error');
      return 'no-fit';
    }
    const [it] = this.hand.splice(idx, 1);
    cooker.items.push(it);
    this.events.push('sizzle');
    this.maybeStartCooking(cooker, which);
    return 'added';
  }

  // An item fits if some recipe for this station still needs it.
  cookerWants(cooker, which, it) {
    const key = itemKey(it);
    const stationKey = which === 'wok' ? 'wok' : 'grill';
    const have = cooker.items.map(itemKey);
    for (const recipe of Object.values(RECIPES)) {
      if (recipe.station !== stationKey) continue;
      const want = recipe[stationKey];
      if (!want.includes(key)) continue;
      if (have.includes(key)) continue;
      const missing = want.filter((k) => !have.includes(k));
      if (missing.includes(key)) return true;
    }
    return false;
  }

  maybeStartCooking(cooker, which) {
    const stationKey = which === 'wok' ? 'wok' : 'grill';
    const have = cooker.items.map(itemKey);
    for (const [id, recipe] of Object.entries(RECIPES)) {
      if (recipe.station !== stationKey) continue;
      if (setMatches(have, recipe[stationKey])) {
        cooker.cooking = true;
        cooker.progress = 0;
        cooker.dish = id;
        return;
      }
    }
  }

  // ---- drink station ----
  clickDrink() {
    // Take a finished drink, or add tea / ice from the hand.
    const finished = this.drink.items.find((it) => it.id === 'es-teh');
    if (finished) {
      if (this.hand.length >= HAND_MAX) {
        this.events.push('error');
        return 'hands-full';
      }
      this.drink.items = [];
      this.hand.push(finished);
      this.events.push('pickup');
      return 'took-drink';
    }
    const idx = this.hand.findIndex((it) => (it.id === 'tea' || it.id === 'ice') && !this.drink.items.some((d) => d.id === it.id));
    if (idx === -1) {
      this.events.push('error');
      return 'no-fit';
    }
    const [it] = this.hand.splice(idx, 1);
    this.drink.items.push(it);
    this.events.push('pour');
    const keys = this.drink.items.map((d) => d.id);
    if (keys.includes('tea') && keys.includes('ice')) {
      this.drink.items = [item('es-teh', false, 'dish')];
      this.events.push('ding');
    }
    return 'added';
  }

  // ---- plate ----
  // Click the plate: place a cooked base on it, add a plate extra, or pick
  // the finished dish up. Returns a status string.
  clickPlate() {
    if (this.plate) {
      if (this.hand.length >= HAND_MAX) {
        this.events.push('error');
        return 'hands-full';
      }
      this.hand.push(item(this.plate, false, 'dish'));
      this.plate = null;
      this.events.push('pickup');
      return 'took-plated';
    }
    // A cooked base in hand goes on the plate first.
    const baseIdx = this.hand.findIndex((it) => it.kind === 'cooked');
    if (baseIdx !== -1) {
      const [base] = this.hand.splice(baseIdx, 1);
      this.plateBase = base.id;
      const recipe = RECIPES[base.id];
      if (recipe.plate.length === 0) {
        this.plate = base.id;
        this.plateBase = null;
        this.events.push('ding');
        return 'plated';
      }
      this.events.push('place');
      return 'base-on-plate';
    }
    // Add a plate extra (sauce) to a waiting base.
    if (this.plateBase) {
      const recipe = RECIPES[this.plateBase];
      const extraIdx = this.hand.findIndex((it) => recipe.plate.includes(it.id));
      if (extraIdx === -1) {
        this.events.push('error');
        return 'no-fit';
      }
      this.hand.splice(extraIdx, 1);
      this.plate = this.plateBase;
      this.plateBase = null;
      this.events.push('ding');
      return 'plated';
    }
    this.events.push('error');
    return 'empty-plate';
  }

  // ---- per-frame ----
  tick(dt, onBurnt) {
    // Chopping finishes on its own; clicks speed it up (handled in input).
    if (this.board && this.board.progress < 1) {
      this.board.progress = Math.min(1, this.board.progress + dt / CHOP_SECONDS);
      if (this.board.progress >= 1) this.events.push('ding');
    }
    for (const cooker of [this.wok, this.grill]) {
      if (cooker.cooking && !cooker.done) {
        const total = cooker === this.wok ? WOK_SECONDS : GRILL_SECONDS;
        cooker.progress = Math.min(1, cooker.progress + dt / total);
        if (cooker.progress >= 1) {
          cooker.done = true;
          cooker.burnTimer = BURN_SECONDS;
          this.events.push('ding');
        }
      } else if (cooker.done) {
        cooker.burnTimer -= dt;
        if (cooker.burnTimer <= 0) {
          cooker.done = false;
          cooker.dish = null;
          cooker.items = [];
          cooker.progress = 0;
          onBurnt();
          this.events.push('burn');
        }
      }
    }
  }

  // Clicking the board while chopping speeds it up.
  hurryChop() {
    if (this.board && this.board.progress < 1) {
      this.board.progress = Math.min(1, this.board.progress + 0.18);
      this.events.push('chop');
    }
  }

  // Drain this frame's sound events.
  takeEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }
}
