// Sizzle & Serve — game state: screens, shift clock, score and combo.
// One clear job: the single source of truth for "where in the game are we".

import { SHIFT_SECONDS, COMBO_WINDOW, COMBO_MAX } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_END = 'end';

export class GameState {
  constructor() {
    this.screen = SCREEN_TITLE;
    this.elapsed = 0; // seconds of shift played
    this.coins = 0;
    this.served = 0;
    this.lost = 0; // tickets that walked out
    this.burnt = 0;
    this.bestCombo = 0;
    this.combo = 0;
    this.comboTimer = 0; // seconds left on the current combo
    this.rush = false; // last 30 seconds: the service rush
    this.paused = false;
    this.muted = false;
    this.message = ''; // short floating notice ("+28 🪙", "Burnt!")
    this.messageTimer = 0;
    this.endStars = 0;
  }

  get timeLeft() {
    return Math.max(0, SHIFT_SECONDS - this.elapsed);
  }

  get isRush() {
    return this.timeLeft <= 30 && this.screen === SCREEN_PLAY;
  }

  startShift() {
    this.screen = SCREEN_PLAY;
    this.elapsed = 0;
    this.coins = 0;
    this.served = 0;
    this.lost = 0;
    this.burnt = 0;
    this.bestCombo = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.rush = false;
    this.message = '';
  }

  // Called every frame while playing; advances the clock and combo timer.
  tick(dt) {
    if (this.screen !== SCREEN_PLAY || this.paused) return;
    this.elapsed += dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.elapsed >= SHIFT_SECONDS) this.finishShift();
  }

  // A dish was served: price + tip, combo grows when serves come quickly.
  // Returns the coins earned so the kitchen can flash them.
  bankServe(price, patienceFraction) {
    const tip = Math.round(10 * patienceFraction);
    const mult = 1 + 0.5 * Math.min(this.combo, COMBO_MAX - 1);
    const earned = Math.round((price + tip) * mult);
    this.coins += earned;
    this.served += 1;
    this.combo = Math.min(this.combo + 1, COMBO_MAX);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = COMBO_WINDOW;
    this.flash(`+${earned} coins${this.combo > 1 ? `  x${this.combo} combo!` : ''}`);
    return earned;
  }

  walkOut() {
    this.lost += 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.flash('A customer walked out!');
  }

  burnDish() {
    this.burnt += 1;
    this.flash('Burnt! Toss it in the bin.');
  }

  flash(text) {
    this.message = text;
    this.messageTimer = 2.2;
  }

  finishShift() {
    this.screen = SCREEN_END;
    // Stars: 1 for serving anything, 2 for a solid shift, 3 for a rush hero.
    this.endStars = this.served >= 14 ? 3 : this.served >= 9 ? 2 : this.served >= 4 ? 1 : 0;
  }
}
