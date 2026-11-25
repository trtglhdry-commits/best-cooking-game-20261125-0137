// Sizzle & Serve — input: mouse clicks and keyboard, mapped to kitchen
// actions. One clear job: decide what the player clicked and call the
// kitchen; it never draws and never changes the score itself.

import { LAYOUT, BIN_ORDER, RECIPES } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_END } from './state.js';

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function binRect(i) {
  return {
    x: LAYOUT.bin0.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap),
    y: LAYOUT.bin0.y,
    w: LAYOUT.bin.w,
    h: LAYOUT.bin.h,
  };
}

// Which named zone (if any) sits under a point, for hover highlights and
// clicks. Zones: bin:<id>, board, wok, grill, drink, plate, trash,
// ticket:<id>, title, end, none.
export function zoneAt(x, y, board) {
  for (let i = 0; i < BIN_ORDER.length; i++) {
    if (inside(x, y, binRect(i))) return `bin:${BIN_ORDER[i]}`;
  }
  if (inside(x, y, LAYOUT.board2)) return 'board';
  if (inside(x, y, LAYOUT.wok)) return 'wok';
  if (inside(x, y, LAYOUT.grill)) return 'grill';
  if (inside(x, y, LAYOUT.drink)) return 'drink';
  if (inside(x, y, LAYOUT.plate)) return 'plate';
  if (inside(x, y, LAYOUT.trash)) return 'trash';
  const slot = LAYOUT.boardSlot;
  for (let i = 0; i < board.tickets.length; i++) {
    const r = {
      x: LAYOUT.boardSlot0.x + i * (slot.w + slot.gap),
      y: LAYOUT.boardSlot0.y,
      w: slot.w,
      h: slot.h,
    };
    if (inside(x, y, r)) return `ticket:${board.tickets[i].id}`;
  }
  return 'none';
}

export class Input {
  constructor(game) {
    this.game = game;
  }

  // A click at logical canvas coordinates. Returns nothing; the kitchen
  // and board change, and the caller plays the kitchen's sound events.
  click(x, y) {
    const { state, board, kitchen } = this.game;
    if (state.screen === SCREEN_TITLE) {
      state.startShift();
      board.reset();
      kitchen.reset();
      return 'start';
    }
    if (state.screen === SCREEN_END) {
      state.screen = SCREEN_TITLE;
      return 'title';
    }
    if (state.paused) return 'paused';
    const zone = zoneAt(x, y, board);
    if (zone.startsWith('bin:')) {
      kitchen.takeFromBin(zone.slice(4));
      return zone;
    }
    if (zone === 'board') {
      // Clicking a chopping board mid-chop hurries it; otherwise place/take.
      if (kitchen.board && kitchen.board.progress < 1) kitchen.hurryChop();
      else kitchen.clickBoard();
      return zone;
    }
    if (zone === 'wok') {
      kitchen.clickCooker(kitchen.wok, 'wok');
      return zone;
    }
    if (zone === 'grill') {
      kitchen.clickCooker(kitchen.grill, 'grill');
      return zone;
    }
    if (zone === 'drink') {
      kitchen.clickDrink();
      return zone;
    }
    if (zone === 'plate') {
      kitchen.clickPlate();
      return zone;
    }
    if (zone === 'trash') {
      kitchen.dropToTrash();
      return zone;
    }
    if (zone.startsWith('ticket:')) {
      return this.serveTicket(zone.slice(7));
    }
    return 'none';
  }

  // Serve the dish in hand to a ticket. A finished dish (kind 'dish') is
  // consumed; anything else is refused with a shake and a buzz.
  serveTicket(ticketId) {
    const { state, board, kitchen } = this.game;
    const dishIdx = kitchen.hand.findIndex((it) => it.kind === 'dish');
    if (dishIdx === -1) {
      kitchen.events.push('error');
      return 'no-dish';
    }
    const dish = kitchen.hand[dishIdx];
    const ticket = board.tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.recipeId !== dish.id) {
      kitchen.events.push('error');
      state.flash(`That ticket wants ${ticket ? RECIPES[ticket.recipeId].name : 'a dish'}!`);
      return 'wrong-dish';
    }
    kitchen.hand.splice(dishIdx, 1);
    const served = board.serve(dish.id);
    const frac = board.patienceFraction(served);
    state.bankServe(RECIPES[dish.id].price, frac);
    kitchen.events.push('serve');
    return 'served';
  }

  // Keyboard: 1-9 grab a bin, Space chops, M mutes, Esc pauses.
  key(keyName) {
    const { state, kitchen } = this.game;
    if (keyName === 'Escape') {
      if (state.screen === SCREEN_PLAY) state.paused = !state.paused;
      return 'pause';
    }
    if (keyName === 'm' || keyName === 'M') {
      state.muted = !state.muted;
      this.game.sound.setMuted(state.muted);
      return 'mute';
    }
    if (state.screen === SCREEN_TITLE && (keyName === 'Enter' || keyName === ' ')) {
      return this.click(640, 644);
    }
    if (state.screen !== SCREEN_PLAY || state.paused) return 'ignored';
    if (keyName >= '1' && keyName <= '9') {
      const id = BIN_ORDER[Number(keyName) - 1];
      if (id) kitchen.takeFromBin(id);
      return 'bin';
    }
    if (keyName === ' ') {
      if (kitchen.board && kitchen.board.progress < 1) kitchen.hurryChop();
      else kitchen.clickBoard();
      return 'chop';
    }
    return 'ignored';
  }
}
