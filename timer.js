/* ============ Timer + inspection (performance.now timestamps only) ============ */
const HOLD = 300;
const ACT = new Set(['hold', 'inspect', 'inspHold', 'running']);
// states: idle | stopped | pre | hold | inspect | inspHold | running
const T = { s: 'idle', t0: 0, tI: 0, hold: 0, pen: '', raf: 0, last: null, beeped: false };
let scr = '';
const ready = () => performance.now() - T.hold >= HOLD;
function arm() { T.hold = performance.now(); T.beeped = false; loop(); }
function loop() {
  cancelAnimationFrame(T.raf);
  const f = () => { draw(); if (ACT.has(T.s)) T.raf = requestAnimationFrame(f); };
  f();
}
function timerDown() {
  const n = performance.now();
  if (T.s === 'running') return stopTimer(n);
  if (T.s === 'idle' || T.s === 'stopped') {
    if (S.settings.insp) { T.s = 'pre'; draw(); } else { T.s = 'hold'; arm(); }
  } else if (T.s === 'inspect') { T.s = 'inspHold'; arm(); }
}
function timerUp() {
  if (T.s === 'pre') { T.tI = performance.now(); T.s = 'inspect'; loop(); }
  else if (T.s === 'hold') { if (ready()) startTimer(); else { T.s = T.last ? 'stopped' : 'idle'; draw(); } }
  else if (T.s === 'inspHold') { if (ready()) startTimer(); else { T.s = 'inspect'; loop(); } }
}
function startTimer() {
  const n = performance.now();
  if (T.s === 'inspHold') {
    const e = (n - T.tI) / 1000, d = S.settings.inspDur;
    T.pen = e <= d ? '' : e <= d + 2 ? '+2' : 'DNF';
  } else T.pen = '';
  T.t0 = n; T.s = 'running'; loop();
}
function stopTimer(n) {
  cancelAnimationFrame(T.raf);
  const raw = Math.round(n - T.t0);
  T.s = 'stopped';
  recordSolve(raw, T.pen);
  beep(660, .08);
}
function resetTimer() { cancelAnimationFrame(T.raf); T.s = 'idle'; T.last = null; T.pen = ''; draw(); }
function inspText() {
  const e = (performance.now() - T.tI) / 1000, d = S.settings.inspDur;
  return e < d ? String(Math.ceil(d - e)) : e <= d + 2 ? '+2' : 'DNF';
}
let ac;
function beep(f = 880, d = .06) {
  if (!S.settings.sound) return;
  try {
    ac = ac || new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f; g.gain.value = .05; o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d);
  } catch (e) {}
}
