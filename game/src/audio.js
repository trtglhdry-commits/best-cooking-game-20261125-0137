// Sizzle & Serve — sound: every effect and the music loop are synthesized
// with the Web Audio API. No audio files, no network, nothing to download.
// One clear job: turn game events into sound, and stay silent until the
// player has interacted (browsers block audio before a gesture).

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  // Call from the first click/keypress; safe to call repeatedly.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.startMusic();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  // A short oscillator blip: (frequency, seconds, wave, volume).
  blip(freq, seconds, type = 'sine', volume = 0.2, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  // Filtered noise burst: the wok sizzle, the chop thock, the pour.
  noise(seconds, filterFreq, volume = 0.25) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  }

  play(event) {
    if (!this.ctx) return;
    switch (event) {
      case 'pickup': this.blip(520, 0.07, 'triangle', 0.15); break;
      case 'place': this.blip(340, 0.08, 'triangle', 0.15); break;
      case 'chop': this.noise(0.08, 900, 0.3); this.blip(180, 0.06, 'square', 0.08); break;
      case 'sizzle': this.noise(0.5, 5200, 0.2); break;
      case 'pour': this.noise(0.35, 1400, 0.18); this.blip(300, 0.2, 'sine', 0.1, 520); break;
      case 'ding': this.blip(880, 0.12, 'sine', 0.18); this.blip(1318, 0.18, 'sine', 0.12); break;
      case 'serve': this.blip(660, 0.1, 'triangle', 0.18); this.blip(880, 0.1, 'triangle', 0.18); this.blip(1100, 0.22, 'triangle', 0.18); break;
      case 'error': this.blip(160, 0.15, 'square', 0.1, 110); break;
      case 'burn': this.noise(0.4, 300, 0.25); this.blip(220, 0.3, 'sawtooth', 0.1, 90); break;
      case 'trash': this.noise(0.15, 500, 0.2); break;
      case 'walkout': this.blip(392, 0.2, 'sine', 0.12, 196); break;
      default: break;
    }
  }

  // A lazy pentatonic pluck loop, one note every 320 ms. Quiet by design.
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const scale = [262, 294, 330, 392, 440, 523, 587];
    const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 2, 4, 5, 6, 5, 3, 2];
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = scale[pattern[this.musicStep % pattern.length]];
      this.blip(note, 0.5, 'triangle', 0.045);
      if (this.musicStep % 4 === 0) this.blip(note / 2, 0.6, 'sine', 0.05);
      this.musicStep += 1;
    }, 320);
  }
}
