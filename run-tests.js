const vm = require('vm'), fs = require('fs'), path = require('path'), assert = require('assert');
const ctx = vm.createContext({ Math });
for (const f of ['scrambler', 'stats']) vm.runInContext(fs.readFileSync(path.join(__dirname, f + '.js'), 'utf8'), ctx);
const get = x => vm.runInContext(x, ctx);
const { CUBES, Stats } = get('({CUBES, Stats})');
const fmt = get('fmt'), finalOf = get('finalOf');
const AX = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
const lens = { '2x2': 10, '3x3': 20, '4x4': 40 };
for (const c of Object.keys(CUBES)) {
  for (let i = 0; i < 1000; i++) {
    const m = CUBES[c].scramble().split(' ');
    assert.strictEqual(m.length, lens[c], c + ' length');
    let last = -1;
    for (const t of m) {
      const r = /^([UDLRFB])(w?)(2|')?$/.exec(t);
      assert(r, c + ' bad token ' + t);
      if (c === '2x2') assert('RUF'.includes(r[1]) && !r[2], '2x2 move ' + t);
      if (c !== '4x4') assert(!r[2], 'wide on ' + c);
      if (r[2]) assert('RUF'.includes(r[1]), 'wide face ' + t);
      assert.notStrictEqual(AX[r[1]], last, c + ' same axis twice: ' + m.join(' '));
      last = AX[r[1]];
    }
  }
}
assert.strictEqual(Stats.avg([10000, 11000, 12000, 13000, 14000], 5), 12000);
assert.strictEqual(Stats.avg([null, 10000, 11000, 12000, 13000], 5), 12000);
assert.strictEqual(Stats.avg([null, null, 11000, 12000, 13000], 5), Infinity);
assert.strictEqual(Stats.avg([1, 2, 3, 4], 5), null);
assert.strictEqual(Stats.avg(Array(11).fill(1000), 12), null);
assert.strictEqual(Stats.avg(Array(12).fill(1000), 12), 1000);
const e = Stats.summary([]);
assert(e.best === null && e.mean === null && e.ao5 === null);
const d = Stats.summary([null, null]);
assert(d.best === null && d.n === 2 && !Object.values(d).some(Number.isNaN));
assert.strictEqual(fmt(14823), '14.82'); assert.strictEqual(fmt(65000), '1:05.00');
assert.strictEqual(fmt(null), '\u2014'); assert.strictEqual(fmt(Infinity), 'DNF'); assert.strictEqual(fmt(14823, 1), '14.8');
assert.strictEqual(finalOf(12000, '+2'), 14000); assert.strictEqual(finalOf(12000, 'DNF'), null);
console.log('All tests passed');
