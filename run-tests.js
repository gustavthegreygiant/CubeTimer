const vm = require('vm'), fs = require('fs'), path = require('path'), assert = require('assert');
const ctx = vm.createContext({ Math });
for (const f of ['scrambler', 'stats']) vm.runInContext(fs.readFileSync(path.join(__dirname, f + '.js'), 'utf8'), ctx);
const get = x => vm.runInContext(x, ctx);
const { CUBES, Stats } = get('({CUBES, Stats})');
const fmt = get('fmt'), finalOf = get('finalOf');
const AX = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
const NN = /^([23]?)([UDLRFB])(w?)(2|')?$/;
function cubic(s, len, extra) {
  const m = s.split(' '); assert.strictEqual(m.length, len); let last = -1;
  for (const t of m) { const r = NN.exec(t); assert(r, t); extra(r, t); assert.notStrictEqual(AX[r[2]], last, s); last = AX[r[2]]; }
}
const V = {
  '2x2': s => cubic(s, 10, (r, t) => assert('RUF'.includes(r[2]) && !r[1] && !r[3], t)),
  '3x3': s => cubic(s, 20, (r, t) => assert(!r[1] && !r[3], t)),
  '4x4': s => cubic(s, 40, (r, t) => assert(!r[1] && (!r[3] || 'RUF'.includes(r[2])), t)),
  '5x5': s => cubic(s, 60, (r, t) => assert(!r[1], t)),
  '6x6': s => cubic(s, 80, (r, t) => assert(!(r[1] === '2' && r[3]) && !(r[1] === '3' && !r[3] && false), t)),
  '7x7': s => cubic(s, 100, (r, t) => assert(!(r[1] === '2' && r[3]), t)),
  pyra(s) { const m = s.split(' '); const mv = m.slice(0, 10), tips = m.slice(10); let l = '';
    for (const t of mv) { assert(/^[ULRB]'?$/.test(t), t); assert.notStrictEqual(t[0], l); l = t[0]; }
    let i = -1; for (const t of tips) { assert(/^[ulrb]'?$/.test(t), t); const k = 'ulrb'.indexOf(t[0]); assert(k > i, s); i = k; } },
  skewb(s) { const m = s.split(' '); assert.strictEqual(m.length, 10); let l = ''; for (const t of m) { assert(/^[RLUB]'?$/.test(t), t); assert.notStrictEqual(t[0], l); l = t[0]; } },
  mega(s) { const rows = s.split('\n'); assert.strictEqual(rows.length, 7); for (const r of rows) assert(/^(R(\+\+|--) D(\+\+|--) ){5}U'?$/.test(r), r); },
  clock(s) { const m = s.split(' '); const names = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];
    names.forEach((n, i) => { const r = /^([A-Z]+)(\d)([+-])$/.exec(m[i]); assert(r && r[1] === n, m[i]); assert(+r[2] <= (r[3] === '-' ? 5 : 6), m[i]); assert(!(r[2] === '0' && r[3] === '-')); });
    assert.strictEqual(m[9], 'y2');
    ['U', 'R', 'D', 'L', 'ALL'].forEach((n, i) => assert(new RegExp('^' + n + '\\d[+-]$').test(m[10 + i]), m[10 + i]));
    let i = -1; for (const p of m.slice(15)) { const k = ['UR', 'DR', 'DL', 'UL'].indexOf(p); assert(k > i, s); i = k; } },
  fto(s) { const A = { U: 0, D: 0, F: 1, B: 1, R: 2, BL: 2, L: 3, BR: 3 }, m = s.split(' '); assert.strictEqual(m.length, 30); let l = -1;
    for (const t of m) { const r = /^(U|D|F|B|R|L|BR|BL)'?$/.exec(t); assert(r, t); assert.notStrictEqual(A[r[1]], l); l = A[r[1]]; } },
  sq1(s) { // replay with an independent model: every slice must cut between pieces
    const L = o => [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7].map(x => x + o), rot = (a, k) => a.map((_, i) => a[((i - k) % 12 + 12) % 12]);
    let top = L(0), bot = L(8); const mv = s.split(' / '); assert.strictEqual(mv.length, 12);
    for (const t of mv) { const r = /^\((-?\d+),(-?\d+)\)$/.exec(t); assert(r, t); const a = +r[1], b = +r[2];
      assert(a >= -5 && a <= 6 && b >= -5 && b <= 6 && (a || b), t);
      const x = rot(top, a), y = rot(bot, -b);
      assert(x[0] !== x[11] && x[5] !== x[6] && y[0] !== y[11] && y[5] !== y[6], 'illegal slice in ' + s);
      top = [...y.slice(0, 6).reverse(), ...x.slice(6)]; bot = [...x.slice(0, 6).reverse(), ...y.slice(6)]; } }
};
for (const c of Object.keys(CUBES)) { assert(V[c], 'no validator for ' + c); for (let i = 0; i < 500; i++) V[c](CUBES[c].scramble()); }
assert.strictEqual(Stats.avg([10000, 11000, 12000, 13000, 14000], 5), 12000);
assert.strictEqual(Stats.avg([null, 10000, 11000, 12000, 13000], 5), 12000);
assert.strictEqual(Stats.avg([null, null, 11000, 12000, 13000], 5), Infinity);
assert.strictEqual(Stats.avg([1, 2, 3, 4], 5), null);
assert.strictEqual(Stats.avg(Array(11).fill(1000), 12), null);
assert.strictEqual(Stats.avg(Array(12).fill(1000), 12), 1000);
const e = Stats.summary([]); assert(e.best === null && e.mean === null && e.ao5 === null);
const d = Stats.summary([null, null]); assert(d.best === null && d.n === 2 && !Object.values(d).some(Number.isNaN));
assert.strictEqual(fmt(14823), '14.82'); assert.strictEqual(fmt(65000), '1:05.00');
assert.strictEqual(fmt(null), '\u2014'); assert.strictEqual(fmt(Infinity), 'DNF'); assert.strictEqual(fmt(14823, 1), '14.8');
assert.strictEqual(finalOf(12000, '+2'), 14000); assert.strictEqual(finalOf(12000, 'DNF'), null);
console.log('All tests passed (' + Object.keys(CUBES).length + ' puzzles x 500 scrambles)');
