// Sizzle & Serve — bootstrap and game loop.
// One clear job: wire the state, board, kitchen, input, sound and renderer
// together, run the frame loop, and keep the canvas scaled to the window.

import { VIEW_W, VIEW_H } from './config.js';
import { makeRng } from './random.js';
import { GameState, SCREEN_PLAY } from './state.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { Input, zoneAt } from './input.js';
import { SoundEngine } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// A seed from the URL (?seed=) keeps a playthrough reproducible; the
// default seed changes with the day so every visit feels a little different.
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || (Date.now() % 2147483647));
const rng = makeRng(seed);

const state = new GameState();
const board = new OrderBoard(rng);
const kitchen = new Kitchen();
const sound = new SoundEngine();
const game = { state, board, kitchen, sound, mouse: { x: -100, y: -100 }, hover: 'none' };
const input = new Input(game);

// A staged scene (?shot=) freezes the clock so screenshots are stable.
const shot = params.get('shot');
const staged = applyShot(shot, game);
if (staged) state.paused = false;

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

// Mouse: track the hand position, highlight the hovered zone, click to act.
function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}
canvas.addEventListener('mousemove', (event) => {
  const p = toLogical(event);
  game.mouse = p;
  game.hover = zoneAt(p.x, p.y, board);
});
canvas.addEventListener('click', (event) => {
  sound.unlock();
  const p = toLogical(event);
  game.mouse = p;
  input.click(p.x, p.y);
  announce();
});
window.addEventListener('keydown', (event) => {
  if (event.key === ' ') event.preventDefault();
  sound.unlock();
  input.key(event.key);
  announce();
});

// Screen-reader status line: what is on the board, in words.
function announce() {
  if (!statusEl) return;
  if (state.screen === 'title') {
    statusEl.textContent = 'Sizzle and Serve. A cooking game. Click to start your shift.';
  } else if (state.screen === 'end') {
    statusEl.textContent = `Shift over. You earned ${state.coins} coins and served ${state.served} dishes. Click to play again.`;
  } else {
    const waiting = board.tickets.map((t) => `${t.recipeId} with ${Math.ceil(t.patience)} seconds`).join(', ');
    statusEl.textContent = `Time left ${Math.ceil(state.timeLeft)} seconds. Coins ${state.coins}. Orders: ${waiting || 'none'}.`;
  }
}

// Debug handle for play-testing (read-only state inspection from the console).
window.__sizzle = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!staged) {
    state.tick(dt);
    if (state.screen === SCREEN_PLAY && !state.paused) {
      board.tick(dt, state.elapsed, (count) => {
        for (let i = 0; i < count; i++) state.walkOut();
        sound.play('walkout');
      });
      kitchen.tick(dt, () => state.burnDish());
    }
  }
  // Drain this frame's sound events.
  for (const event of kitchen.takeEvents()) sound.play(event);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
announce();
