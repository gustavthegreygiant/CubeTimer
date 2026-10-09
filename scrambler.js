/* ============ Scramble engine (independent of UI) ============ */
const Scrambler = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const AX = [['U','D'], ['R','L'], ['F','B']], SUF = ['', "'", '2'];
  // Random-move scrambles: never the same axis twice in a row (no R R', U U2, R L R ...).
  function gen({ len, axes = AX, wide = false }) {
    const out = []; let last = -1;
    for (let i = 0; i < len; i++) {
      let a; do { a = rnd(axes.length); } while (a === last);
      last = a;
      const f = axes[a][rnd(axes[a].length)];
      const w = wide && 'RUF'.includes(f) && rnd(2) ? 'w' : '';
      out.push(f + w + SUF[rnd(3)]);
    }
    return out.join(' ');
  }
  // --- NxN big cubes: outer, wide (Rw), and for 6x6/7x7 inner slices (2R, 3R, 3Rw). New axis every move.
  function big(len, types) {
    const out = []; let last = -1;
    for (let i = 0; i < len; i++) {
      let a; do { a = rnd(3); } while (a === last);
      last = a;
      out.push(types[rnd(types.length)].replace('X', AX[a][rnd(2)]) + SUF[rnd(3)]);
    }
    return out.join(' ');
  }
  // --- Pyraminx / Skewb: random face turns (never the same face twice in a row), 120 degree turns only.
  function seq(len, set) {
    const o = []; let last = '';
    for (let i = 0; i < len; i++) { let f; do { f = set[rnd(set.length)]; } while (f === last); last = f; o.push(f + (rnd(2) ? "'" : '')); }
    return o;
  }
  function pyra() {
    const o = seq(10, 'ULRB');
    for (const t of 'ulrb') { const r = rnd(3); if (r) o.push(t + (r === 2 ? "'" : '')); }   // tips: none / cw / ccw
    return o.join(' ');
  }
  const skewb = () => seq(10, 'RLUB').join(' ');
  // --- Megaminx: Pochmann style, 7 rows of 10 R/D turns plus U.
  function mega() {
    const rows = [];
    for (let r = 0; r < 7; r++) {
      const m = [];
      for (let i = 0; i < 10; i++) m.push((i % 2 ? 'D' : 'R') + (rnd(2) ? '++' : '--'));
      m.push(rnd(2) ? 'U' : "U'");
      rows.push(m.join(' '));
    }
    return rows.join('\n');
  }
  // --- Clock: 9 pin-position turns, y2, 5 more, then which pins are up.
  function clock() {
    const v = () => { const n = rnd(12) - 5; return Math.abs(n) + (n < 0 ? '-' : '+'); };
    const m = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'].map(p => p + v());
    m.push('y2');
    ['U', 'R', 'D', 'L', 'ALL'].forEach(p => m.push(p + v()));
    ['UR', 'DR', 'DL', 'UL'].forEach(p => { if (rnd(2)) m.push(p); });
    return m.join(' ');
  }
  // --- FTO: 8 face turns (120 degrees); the two faces on one axis never repeat back to back.
  const FTO = [['U', 'D'], ['F', 'B'], ['R', 'BL'], ['L', 'BR']];
  function fto() {
    const o = []; let last = -1;
    for (let i = 0; i < 30; i++) { let a; do { a = rnd(4); } while (a === last); last = a; o.push(FTO[a][rnd(2)] + (rnd(2) ? "'" : '')); }
    return o.join(' ');
  }
  // --- Square-1: simulate layer shapes so every "/" is a legal slice. Each layer is 12 slots; a piece id spans 1 (edge) or 2 (corner) slots.
  // Turn direction: top clockwise from above, bottom clockwise as seen from below (i.e. opposite when viewed from above).
  const SQ1_BOTTOM_FLIP = true;
  function sq1() {
    const L = o => [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7].map(x => x + o);
    const rot = (a, k) => a.map((_, i) => a[((i - k) % 12 + 12) % 12]);
    const ok = a => a[0] !== a[11] && a[5] !== a[6];
    let top = L(0), bot = L(8); const out = [];
    for (let n = 0; n < 12; n++) {
      const opts = [];
      for (let a = -5; a <= 6; a++) for (let b = -5; b <= 6; b++) {
        if (!a && !b) continue;
        const t = rot(top, a), u = rot(bot, SQ1_BOTTOM_FLIP ? -b : b);
        if (ok(t) && ok(u)) opts.push([a, b, t, u]);
      }
      const [a, b, t, u] = opts[rnd(opts.length)];
      out.push('(' + a + ',' + b + ')');
      top = [...u.slice(0, 6).reverse(), ...t.slice(6)];   // slice: right halves swap layers (mirrored)
      bot = [...t.slice(0, 6).reverse(), ...u.slice(6)];
    }
    return out.join(' / ');
  }
  return { gen, big, pyra, skewb, mega, clock, fto, sq1 };
})();

// Add a new puzzle here: label + scramble function.
const BIG_T = ['X', 'Xw', '3Xw', '2X', '3X'];
const CUBES = {
  '2x2': { label: '2×2', scramble: () => Scrambler.gen({ len: 10, axes: [['R'], ['U'], ['F']] }) },
  '3x3': { label: '3×3', scramble: () => Scrambler.gen({ len: 20 }) },
  '4x4': { label: '4×4', scramble: () => Scrambler.gen({ len: 40, wide: true }) },
  '5x5': { label: '5×5', scramble: () => Scrambler.big(60, ['X', 'Xw']) },
  '6x6': { label: '6×6', scramble: () => Scrambler.big(80, BIG_T) },
  '7x7': { label: '7×7', scramble: () => Scrambler.big(100, BIG_T) },
  pyra: { label: 'Pyraminx', scramble: () => Scrambler.pyra() },
  skewb: { label: 'Skewb', scramble: () => Scrambler.skewb() },
  mega: { label: 'Megaminx', scramble: () => Scrambler.mega() },
  sq1: { label: 'Square-1', scramble: () => Scrambler.sq1() },
  clock: { label: 'Clock', scramble: () => Scrambler.clock() },
  fto: { label: 'FTO', scramble: () => Scrambler.fto() }
};
