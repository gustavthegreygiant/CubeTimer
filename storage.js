/* ============ Storage + state (sessions, PBs, settings) ============ */
const Store = {
  key: 'cubetimer.v1',
  load() { try { return JSON.parse(localStorage.getItem(this.key)); } catch (e) { return null; } },
  save(s) { try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) {} }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const mkSession = (cube, name) => ({ id: uid(), cube, name, solves: [] });
let S;
function initState() {
  const l = Store.load() || {};
  S = {
    cube: CUBES[l.cube] ? l.cube : '3x3',
    settings: Object.assign({ insp: false, inspDur: 15, disp: 'cs', theme: 'system', sound: false, confirmClear: true, orient: 'auto', accent: 'blue', tcolor: 'default', lock: 1.5, celebrate: true }, l.settings),
    sessions: Array.isArray(l.sessions) ? l.sessions : [],
    active: l.active || {}, pbs: l.pbs || {}
  };
  for (const c in CUBES) {
    S.pbs[c] = S.pbs[c] || {};
    for (const k in S.pbs[c]) if (typeof S.pbs[c][k] === 'number') S.pbs[c][k] = { v: S.pbs[c][k] };  // old format
    if (!S.sessions.some(x => x.cube === c)) S.sessions.push(mkSession(c, 'Session 1'));
    if (!S.sessions.find(x => x.id === S.active[c])) S.active[c] = S.sessions.find(x => x.cube === c).id;
  }
}
const save = () => Store.save(S);
const cur = () => S.sessions.find(x => x.id === S.active[S.cube]);
const PBK = [['single', 'Single'], ['ao5', 'Ao5'], ['ao12', 'Ao12'], ['ao50', 'Ao50'], ['ao100', 'Ao100']];
const PBN = { single: 1, ao5: 5, ao12: 12, ao50: 50, ao100: 100 };
// A PB record keeps the value, date and the solves (with scrambles) that made it.
function checkPBs(solves) {
  const f = solves.map(s => s.finalTime), sm = Stats.summary(f), pb = S.pbs[S.cube], hit = [];
  const now = { single: f[f.length - 1], ao5: sm.ao5, ao12: sm.ao12, ao50: sm.ao50, ao100: sm.ao100 };
  for (const [k, name] of PBK) {
    const v = now[k], old = pb[k] && pb[k].v;
    if (v == null || !isFinite(v)) continue;
    if (old == null || v < old) {
      hit.push(name);
      pb[k] = { v, ts: Date.now(), solves: solves.slice(-PBN[k]).map(s => ({ t: s.finalTime, raw: s.rawTime, pen: s.penalty, sc: s.scramble })) };
    }
  }
  return hit;
}
