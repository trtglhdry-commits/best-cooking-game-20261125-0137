// Sizzle & Serve — seeded random numbers.
// One clear job: every random choice in the game flows through here, so a
// screenshot seed replays the same kitchen exactly.

// mulberry32: small, fast, deterministic for a 32-bit seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    // Integer in [min, max).
    int(min, max) {
      return min + Math.floor(next() * (max - min));
    },
    // Pick one element of an array.
    pick(array) {
      return array[Math.floor(next() * array.length)];
    },
    // Pick a recipe id, weighted so cheap drinks appear less often than
    // cooked dishes and the wok dishes share the rest evenly.
    pickRecipe() {
      const roll = next();
      if (roll < 0.32) return 'nasi-goreng';
      if (roll < 0.62) return 'mie-goreng';
      if (roll < 0.86) return 'sate-ayam';
      return 'es-teh';
    },
  };
}
