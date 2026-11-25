// Sizzle & Serve — rendering: every pixel of the kitchen is drawn here
// with canvas vector shapes and glyphs. No image files, nothing borrowed.
// One clear job: turn game state into a readable kitchen at a glance.

import { VIEW_W, VIEW_H, COLORS, LAYOUT, INGREDIENTS, RECIPES, BIN_ORDER, SHIFT_SECONDS } from './config.js';
import { itemIcon, itemLabel } from './kitchen.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_END } from './state.js';

// ---------- tiny canvas helpers ----------

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function pill(ctx, x, y, w, h, fill, stroke = null) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ---------- food art: small plated dishes drawn from shapes ----------

export function drawDish(ctx, dishId, cx, cy, s) {
  // s = scale; the plate is about 64*s wide.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // Plate.
  ctx.fillStyle = COLORS.plateWhite;
  ctx.beginPath();
  ctx.ellipse(0, 4, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (dishId === 'nasi-goreng') {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0, -2, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fdf6d8';
    ctx.beginPath();
    ctx.arc(6, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2b705';
    ctx.beginPath();
    ctx.arc(6, -8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d64545';
    ctx.fillRect(-14, -12, 8, 3);
    ctx.fillRect(-4, -16, 8, 3);
  } else if (dishId === 'mie-goreng') {
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-8 + i * 6, -6, 8, Math.PI * 0.15, Math.PI * 0.9);
      ctx.stroke();
    }
    ctx.fillStyle = '#7bc47f';
    ctx.fillRect(-16, -14, 6, 6);
    ctx.fillRect(8, -18, 6, 6);
    ctx.fillStyle = '#e8a87c';
    ctx.fillRect(-2, -12, 8, 6);
  } else if (dishId === 'sate-ayam') {
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2.5;
    for (const off of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(off - 14, -16);
      ctx.lineTo(off + 16, -2);
      ctx.stroke();
    }
    ctx.fillStyle = '#a5662e';
    for (const [x, y] of [[-12, -12], [-4, -8], [4, -4], [10, -2], [-2, -14], [14, 0]]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.arc(18, 2, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'es-teh') {
    ctx.fillStyle = 'rgba(200, 225, 240, 0.9)';
    roundRect(ctx, -12, -26, 24, 30, 4);
    ctx.fill();
    ctx.fillStyle = '#c98a2e';
    roundRect(ctx, -9, -14, 18, 15, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-7, -22, 5, 5);
    ctx.fillRect(2, -20, 5, 5);
    ctx.strokeStyle = '#d64545';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -30);
    ctx.lineTo(10, -12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIngredientIcon(ctx, it, cx, cy, size) {
  text(ctx, itemIcon(it), cx, cy, size, '#fff');
}

// ---------- the kitchen ----------

function drawRoom(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.wallStripe;
  for (let x = 0; x < VIEW_W; x += 96) ctx.fillRect(x, 0, 48, 128);
  // Floor tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 528, VIEW_W, VIEW_H - 528);
  ctx.fillStyle = COLORS.floorTile;
  for (let y = 528; y < VIEW_H; y += 48) {
    for (let x = ((y / 48) % 2) * 48; x < VIEW_W; x += 96) ctx.fillRect(x, y, 90, 42);
  }
  // Counter.
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, LAYOUT.counter.x, LAYOUT.counter.y, LAYOUT.counter.w, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.counterFront;
  ctx.fillRect(LAYOUT.counter.x + 8, LAYOUT.counter.y + 34, LAYOUT.counter.w - 16, LAYOUT.counter.h - 34);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = LAYOUT.counter.x + 60; x < LAYOUT.counter.x + LAYOUT.counter.w; x += 120) {
    ctx.fillRect(x, LAYOUT.counter.y + 40, 4, LAYOUT.counter.h - 48);
  }
  // Window with a street view, for warmth.
}

function drawOrderBoard(ctx, board) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#7a4a21';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  const slot = LAYOUT.boardSlot;
  board.tickets.forEach((ticket, i) => {
    const x = LAYOUT.boardSlot0.x + i * (slot.w + slot.gap);
    const y = LAYOUT.boardSlot0.y;
    const frac = board.patienceFraction(ticket);
    const recipe = RECIPES[ticket.recipeId];
    const bg = frac > 0.5 ? COLORS.ticket : frac > 0.25 ? COLORS.ticketLate : COLORS.ticketAngry;
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, slot.w, slot.h, 8);
    ctx.fill();
    ctx.strokeStyle = frac <= 0.25 ? COLORS.bad : '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawDish(ctx, ticket.recipeId, x + 34, y + 36, 0.62);
    text(ctx, recipe.name, x + 66, y + 22, 14, COLORS.ink, 'left');
    text(ctx, `${recipe.price} coins`, x + 66, y + 42, 12, COLORS.inkSoft, 'left');
    // Patience bar.
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, x + 66, y + 56, 96, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? COLORS.good : frac > 0.25 ? '#e8a33d' : COLORS.bad;
    roundRect(ctx, x + 66, y + 56, 96 * frac, 10, 5);
    ctx.fill();
    text(ctx, `${Math.ceil(ticket.patience)}s`, x + 66, y + 72, 10, COLORS.inkSoft, 'left');
  });
}

function drawTimerAndScore(ctx, state) {
  const t = LAYOUT.timer;
  ctx.fillStyle = '#2b2118';
  roundRect(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fill();
  const mm = Math.floor(state.timeLeft / 60);
  const ss = String(Math.floor(state.timeLeft % 60)).padStart(2, '0');
  const urgent = state.timeLeft <= 30;
  text(ctx, '⏱ SHIFT', t.x + t.w / 2, t.y + 22, 13, '#f7e8c9');
  text(ctx, `${mm}:${ss}`, t.x + t.w / 2, t.y + 58, 34, urgent ? '#ff8a7a' : '#ffffff');
  const s = LAYOUT.score;
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '🪙 COINS', s.x + 18, s.y + 24, 13, COLORS.inkSoft, 'left');
  text(ctx, String(state.coins), s.x + 18, s.y + 58, 32, COLORS.ink, 'left');
  text(ctx, `served ${state.served} · lost ${state.lost}`, s.x + s.w - 14, s.y + 26, 12, COLORS.inkSoft, 'right');
  if (state.combo > 1) {
    pill(ctx, s.x + s.w - 108, s.y + 52, 94, 26, '#f2b705');
    text(ctx, `COMBO x${state.combo}`, s.x + s.w - 61, s.y + 65, 13, '#2b2118');
  }
}

function stationLabel(ctx, x, y, w, label) {
  text(ctx, label, x + w / 2, y - 14, 15, COLORS.ink);
}

function drawChoppingBoard(ctx, kitchen, time) {
  const b = LAYOUT.board2;
  stationLabel(ctx, b.x, b.y, b.w, '🔪 CHOPPING BOARD');
  ctx.fillStyle = COLORS.boardWood;
  roundRect(ctx, b.x, b.y, b.w, 170, 10);
  ctx.fill();
  ctx.strokeStyle = '#a5713d';
  ctx.lineWidth = 3;
  ctx.stroke();
  const board = kitchen.board;
  if (board) {
    drawIngredientIcon(ctx, board.item, b.x + b.w / 2, b.y + 70, 52);
    text(ctx, itemLabel(board.item), b.x + b.w / 2, b.y + 118, 14, COLORS.ink);
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, b.x + 30, b.y + 138, b.w - 60, 12, 6);
    ctx.fill();
    ctx.fillStyle = board.progress >= 1 ? COLORS.good : '#e8a33d';
    roundRect(ctx, b.x + 30, b.y + 138, (b.w - 60) * board.progress, 12, 6);
    ctx.fill();
    if (board.progress >= 1) text(ctx, 'READY — click to take', b.x + b.w / 2, b.y + 164, 12, COLORS.good);
  } else {
    text(ctx, 'put something choppable here', b.x + b.w / 2, b.y + 85, 13, COLORS.inkSoft);
  }
  // Knife, resting.
  ctx.save();
  ctx.translate(b.x + b.w - 34, b.y + 30);
  ctx.rotate(0.5 + Math.sin(time * 2) * 0.02);
  ctx.fillStyle = '#cfd6da';
  ctx.fillRect(-4, -26, 8, 34);
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(-4, 8, 8, 16);
  ctx.restore();
}

function drawCooker(ctx, kitchen, which) {
  const isWok = which === 'wok';
  const box = isWok ? LAYOUT.wok : LAYOUT.grill;
  const cooker = isWok ? kitchen.wok : kitchen.grill;
  stationLabel(ctx, box.x, box.y, box.w, isWok ? '🍳 WOK' : '🔥 GRILL');
  // Burner.
  ctx.fillStyle = COLORS.steelDark;
  roundRect(ctx, box.x + 10, box.y + 120, box.w - 20, 50, 10);
  ctx.fill();
  if (cooker.cooking && !cooker.done) {
    const flick = 0.7 + Math.sin(performance.now() / 90) * 0.3;
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 148, 46 * flick, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.flameCore;
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 148, 26 * flick, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vessel.
  ctx.fillStyle = isWok ? COLORS.wok : '#4a4f55';
  ctx.beginPath();
  ctx.ellipse(box.x + box.w / 2, box.y + 92, 86, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.ellipse(box.x + box.w / 2, box.y + 86, 70, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Contents.
  if (cooker.items.length > 0 || cooker.done) {
    if (cooker.done) {
      drawDish(ctx, cooker.dish, box.x + box.w / 2, box.y + 78, 0.85);
    } else {
      cooker.items.forEach((it, i) => {
        drawIngredientIcon(ctx, it, box.x + 60 + i * 46, box.y + 84, 30);
      });
    }
  }
  // Steam while cooking.
  if (cooker.cooking && !cooker.done) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 3; i++) {
      const px = box.x + 70 + i * 40 + Math.sin(performance.now() / 500 + i * 2) * 6;
      const py = box.y + 46 - ((performance.now() / 40 + i * 22) % 40);
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Progress / state line.
  if (cooker.done) {
    const danger = cooker.burnTimer <= 4;
    text(ctx, danger ? `BURNS IN ${Math.ceil(cooker.burnTimer)}s!` : 'READY — click to take', box.x + box.w / 2, box.y + 186, 13, danger ? COLORS.bad : COLORS.good);
  } else if (cooker.cooking) {
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, box.x + 30, box.y + 178, box.w - 60, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#e8a33d';
    roundRect(ctx, box.x + 30, box.y + 178, (box.w - 60) * cooker.progress, 12, 6);
    ctx.fill();
  } else if (cooker.items.length > 0) {
    text(ctx, 'add the rest of the recipe', box.x + box.w / 2, box.y + 186, 12, COLORS.inkSoft);
  } else {
    text(ctx, isWok ? 'rice · egg · noodle · chopped' : 'chopped chicken', box.x + box.w / 2, box.y + 186, 12, COLORS.inkSoft);
  }
}

function drawDrinkStation(ctx, kitchen) {
  const d = LAYOUT.drink;
  stationLabel(ctx, d.x, d.y, d.w, '🧋 DRINK STATION');
  ctx.fillStyle = '#fdfdf6';
  roundRect(ctx, d.x, d.y, d.w, 170, 10);
  ctx.fill();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (kitchen.drink.items.length === 0) {
    text(ctx, 'a glass waits here', d.x + d.w / 2, d.y + 85, 13, COLORS.inkSoft);
  } else {
    const finished = kitchen.drink.items[0].kind === 'dish';
    if (finished) {
      drawDish(ctx, 'es-teh', d.x + d.w / 2, d.y + 92, 1.15);
      text(ctx, 'READY — click to take', d.x + d.w / 2, d.y + 150, 12, COLORS.good);
    } else {
      kitchen.drink.items.forEach((it, i) => {
        drawIngredientIcon(ctx, it, d.x + 60 + i * 60, d.y + 80, 40);
      });
      text(ctx, 'add the other half', d.x + d.w / 2, d.y + 140, 12, COLORS.inkSoft);
    }
  }
}

function drawPlateStation(ctx, kitchen) {
  const p = LAYOUT.plate;
  stationLabel(ctx, p.x, p.y, p.w, '🍽️ PLATE');
  ctx.fillStyle = '#fdfdf6';
  roundRect(ctx, p.x, p.y, p.w, 170, 10);
  ctx.fill();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (kitchen.plate) {
    drawDish(ctx, kitchen.plate, p.x + p.w / 2, p.y + 88, 1.05);
    text(ctx, RECIPES[kitchen.plate].name, p.x + p.w / 2, p.y + 140, 14, COLORS.ink);
    text(ctx, 'READY TO SERVE', p.x + p.w / 2, p.y + 162, 12, COLORS.good);
  } else if (kitchen.plateBase) {
    drawDish(ctx, kitchen.plateBase, p.x + p.w / 2, p.y + 88, 1.05);
    const need = RECIPES[kitchen.plateBase].plate.map((id) => INGREDIENTS[id].name).join(' + ');
    text(ctx, `needs: ${need}`, p.x + p.w / 2, p.y + 150, 12, COLORS.inkSoft);
  } else {
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + 85, 56, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'an empty plate', p.x + p.w / 2, p.y + 140, 13, COLORS.inkSoft);
  }
  // Trash bin.
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#6e7a82';
  roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 8);
  ctx.fill();
  text(ctx, '🗑️ BIN', tr.x + tr.w / 2, tr.y + tr.h / 2, 14, '#fff');
}

function drawBins(ctx, kitchen, hover) {
  const bins = LAYOUT.bins;
  ctx.fillStyle = 'rgba(43,33,24,0.08)';
  roundRect(ctx, bins.x, bins.y, bins.w, bins.h, 12);
  ctx.fill();
  text(ctx, 'INGREDIENTS — click to take (keys 1–9)', bins.x + 14, bins.y + 16, 13, COLORS.inkSoft, 'left');
  BIN_ORDER.forEach((id, i) => {
    const x = LAYOUT.bin0.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap);
    const y = LAYOUT.bin0.y;
    const ing = INGREDIENTS[id];
    const isHover = hover === `bin:${id}`;
    ctx.fillStyle = isHover ? '#fff3d6' : '#fdfdf6';
    roundRect(ctx, x, y, LAYOUT.bin.w, LAYOUT.bin.h, 10);
    ctx.fill();
    ctx.strokeStyle = isHover ? COLORS.gold : '#d8cfc0';
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();
    text(ctx, ing.icon, x + LAYOUT.bin.w / 2, y + 44, 40, '#fff');
    text(ctx, ing.name, x + LAYOUT.bin.w / 2, y + 84, 14, COLORS.ink);
    text(ctx, ing.chop ? 'needs chopping' : 'ready to use', x + LAYOUT.bin.w / 2, y + 104, 11, COLORS.inkSoft);
    text(ctx, String(i + 1), x + 12, y + 14, 11, COLORS.inkSoft, 'left');
  });
}

function drawHand(ctx, kitchen, mouse) {
  // The hand is drawn at the cursor: the items the player carries.
  if (kitchen.hand.length === 0) return;
  const x = mouse.x + 18;
  const y = mouse.y - 14;
  const w = kitchen.hand.length * 52 + 16;
  ctx.fillStyle = 'rgba(43,33,24,0.9)';
  roundRect(ctx, x, y, w, 52, 10);
  ctx.fill();
  kitchen.hand.forEach((it, i) => {
    drawIngredientIcon(ctx, it, x + 34 + i * 52, y + 26, 28);
  });
  text(ctx, `${kitchen.hand.length}/${3} in hand`, x + w / 2, y + 62, 11, '#fff');
}

function drawRushBanner(ctx, state) {
  if (!state.isRush) return;
  const pulse = 0.75 + Math.sin(performance.now() / 200) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  pill(ctx, VIEW_W / 2 - 150, 116, 300, 30, '#d64545');
  text(ctx, '🔥 SERVICE RUSH — last 30 seconds!', VIEW_W / 2, 131, 15, '#fff');
  ctx.restore();
}

function drawMessage(ctx, state) {
  if (state.messageTimer <= 0 || !state.message) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageTimer);
  pill(ctx, VIEW_W / 2 - 190, 668, 380, 34, 'rgba(43,33,24,0.92)');
  text(ctx, state.message, VIEW_W / 2, 685, 15, '#fff');
  ctx.restore();
}

// ---------- screens ----------

function drawTitle(ctx, time) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A big steaming wok as the hero image.
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, 340, 430, 600, 40, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.wok;
  ctx.beginPath();
  ctx.ellipse(640, 420, 220, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(640, 400, 110, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fdf6d8';
  ctx.beginPath();
  ctx.arc(680, 372, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2b705';
  ctx.beginPath();
  ctx.arc(680, 372, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 3; i++) {
    const px = 580 + i * 60 + Math.sin(time / 600 + i) * 8;
    ctx.beginPath();
    ctx.arc(px, 300 - ((time / 14 + i * 26) % 60), 12, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, '🍳 SIZZLE & SERVE', 640, 130, 64, COLORS.ink);
  text(ctx, 'a little warung cooking game', 640, 190, 24, COLORS.inkSoft);
  text(ctx, 'Cook to order. Chop, wok, grill, plate, serve — before the ticket walks out.', 640, 236, 18, COLORS.ink);
  // Menu of dishes.
  Object.values(RECIPES).forEach((recipe, i) => {
    const x = 300 + i * 230;
    ctx.fillStyle = '#fff8e1';
    roundRect(ctx, x, 480, 200, 118, 12);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawDish(ctx, Object.keys(RECIPES)[i], x + 100, 514, 0.9);
    text(ctx, recipe.name, x + 100, 548, 15, COLORS.ink);
    text(ctx, `${recipe.price} coins`, x + 100, 566, 12, COLORS.inkSoft);
    text(ctx, recipe.blurb, x + 100, 582, 11, COLORS.inkSoft);
  });
  const pulse = 0.8 + Math.sin(time / 300) * 0.2;
  ctx.save();
  ctx.globalAlpha = pulse;
  pill(ctx, 490, 620, 300, 48, '#2e9e5b');
  text(ctx, '▶ CLICK TO START YOUR SHIFT', 640, 644, 17, '#fff');
  ctx.restore();
  text(ctx, 'Mouse to click · keys 1–9 grab ingredients · Space chops · M mutes · Esc pauses', 640, 694, 13, COLORS.inkSoft);
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, 340, 120, 600, 480, 16);
  ctx.fill();
  text(ctx, 'SHIFT OVER!', 640, 180, 44, COLORS.ink);
  text(ctx, '★'.repeat(state.endStars) + '☆'.repeat(3 - state.endStars), 640, 240, 40, '#f2b705');
  const rows = [
    ['Coins earned', `${state.coins} 🪙`],
    ['Dishes served', String(state.served)],
    ['Customers lost', String(state.lost)],
    ['Dishes burnt', String(state.burnt)],
    ['Best combo', `x${Math.max(1, state.bestCombo)}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 300 + i * 44;
    text(ctx, label, 420, y, 18, COLORS.inkSoft, 'left');
    text(ctx, value, 860, y, 18, COLORS.ink, 'right');
  });
  pill(ctx, 490, 530, 300, 44, '#2e9e5b');
  text(ctx, '↻ CLICK TO PLAY AGAIN', 640, 552, 16, '#fff');
  text(ctx, 'Sizzle & Serve — an original game, built for make.fun', 640, 668, 12, '#f7e8c9');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,33,24,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '⏸ PAUSED — press Esc to resume', VIEW_W / 2, VIEW_H / 2, 30, '#fff');
}

// ---------- main entry ----------

export function render(ctx, game) {
  const { state, board, kitchen, mouse, hover } = game;
  const time = performance.now();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, time);
    return;
  }
  drawRoom(ctx);
  drawOrderBoard(ctx, board);
  drawTimerAndScore(ctx, state);
  drawChoppingBoard(ctx, kitchen, time);
  drawCooker(ctx, kitchen, 'wok');
  drawCooker(ctx, kitchen, 'grill');
  drawDrinkStation(ctx, kitchen);
  drawPlateStation(ctx, kitchen);
  drawBins(ctx, kitchen, hover);
  drawRushBanner(ctx, state);
  drawHand(ctx, kitchen, mouse);
  drawMessage(ctx, state);
  if (state.screen === SCREEN_END) drawEnd(ctx, state);
  if (state.paused && state.screen === SCREEN_PLAY) drawPaused(ctx);
}
