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
  return { gen };
})();

// Add a new puzzle here: label + scramble function.
const CUBES = {
  '2x2': { label: '2×2', scramble: () => Scrambler.gen({ len: 10, axes: [['R'], ['U'], ['F']] }) },
  '3x3': { label: '3×3', scramble: () => Scrambler.gen({ len: 20 }) },
  '4x4': { label: '4×4', scramble: () => Scrambler.gen({ len: 40, wide: true }) }
};
