// Sizzle & Serve — screenshot staging: ?shot= picks a scene of the real
// game so its maker can photograph it. The scenes drive the same state
// the player drives — no fake UI, no composited images.
// One clear job: translate a shot name into a game state.
//
//   ?shot=start  title screen
//   ?shot=play   mid-shift: two tickets, wok cooking, a dish on the plate
//   ?shot=rush   late shift: four tickets, low patience, rush banner
//   ?shot=end    results screen after a busy shift

import { SCREEN_PLAY, SCREEN_END } from './state.js';
import { item } from './kitchen.js';

function setTicket(board, recipeId, patience, maxPatience) {
  board.tickets.push({ id: `SHOT-${recipeId}`, recipeId, patience, maxPatience });
}

export function applyShot(name, game) {
  const { state, board, kitchen } = game;
  if (!name) return false;
  if (name === 'start') {
    state.screen = 'title';
    return true;
  }
  if (name === 'play') {
    state.startShift();
    state.elapsed = 47;
    state.coins = 86;
    state.served = 5;
    state.combo = 2;
    state.comboTimer = 6;
    board.reset();
    board.spawnTimer = 6;
    setTicket(board, 'nasi-goreng', 34, 48);
    setTicket(board, 'mie-goreng', 22, 46);
    kitchen.reset();
    // A wok mid-cook: rice + egg in, chili chopped and waiting on the board.
    kitchen.wok.items = [item('rice'), item('egg')];
    kitchen.wok.cooking = true;
    kitchen.wok.progress = 0.55;
    kitchen.wok.dish = 'nasi-goreng';
    kitchen.board = { item: item('chili', true), progress: 0.7 };
    // A sate plated and ready to serve, plus a noodle in hand.
    kitchen.plate = 'sate-ayam';
    kitchen.hand = [item('noodle')];
    return true;
  }
  if (name === 'rush') {
    state.startShift();
    state.elapsed = 132; // 18 seconds left: the rush banner shows
    state.coins = 214;
    state.served = 12;
    state.combo = 3;
    state.comboTimer = 7;
    board.reset();
    board.spawnTimer = 4;
    setTicket(board, 'mie-goreng', 9, 40);
    setTicket(board, 'sate-ayam', 14, 38);
    setTicket(board, 'nasi-goreng', 6, 44);
    setTicket(board, 'es-teh', 18, 38);
    kitchen.reset();
    kitchen.wok.items = [item('noodle'), item('chicken', true)];
    kitchen.wok.cooking = true;
    kitchen.wok.progress = 0.8;
    kitchen.wok.dish = 'mie-goreng';
    kitchen.grill.items = [item('chicken', true)];
    kitchen.grill.cooking = true;
    kitchen.grill.progress = 0.4;
    kitchen.grill.dish = 'sate-ayam';
    kitchen.drink.items = [item('tea')];
    kitchen.hand = [item('veggie', true), item('sauce')];
    return true;
  }
  if (name === 'end') {
    state.startShift();
    state.elapsed = 150;
    state.coins = 246;
    state.served = 13;
    state.lost = 2;
    state.burnt = 1;
    state.bestCombo = 3;
    state.screen = SCREEN_END;
    state.endStars = 3;
    board.reset();
    kitchen.reset();
    return true;
  }
  return false;
}
