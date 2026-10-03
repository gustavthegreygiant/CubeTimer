/* ============ UI ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sd = s => s.penalty === 'DNF' ? 'DNF' : fmt(s.finalTime);

function inspCls() {  // blue = plenty of time, amber = last 3 s / +2 zone, red = DNF
  const e = (performance.now() - T.tI) / 1000, d = S.settings.inspDur;
  return e < d - 3 ? 'ins' : e <= d + 2 ? 'warn' : 'bad';
}
function draw() {
  let txt = '0.00', cls = '', sub = '';
  const dsp = S.settings.disp;
  switch (T.s) {
    case 'stopped':
      if (T.last) {
        txt = sd(T.last);
        sub = T.last.penalty === 'DNF' ? 'DNF (raw ' + fmt(T.last.rawTime) + ')' : T.last.penalty ? '+2 penalty' : '';
      }
      break;
    case 'hold': case 'inspHold': {
      const r = ready();
      if (r && !T.beeped) { T.beeped = true; beep(); }
      if (r) { txt = 'READY'; cls = 'ready'; }
      else if (T.s === 'hold') { cls = 'held'; }
      else { txt = inspText(); cls = 'held'; }
      break;
    }
    case 'inspect': txt = inspText(); cls = inspCls(); break;
    case 'running': txt = dsp === 'hide' ? '…' : fmt(performance.now() - T.t0, dsp === 'ds' ? 1 : 2); break;
  }
  $('#tm').textContent = txt; $('#tm').className = 'tm ' + cls; $('#sub').textContent = sub;
  if (typeof setFocus === 'function') setFocus(ACT.has(T.s));
  $('#tz').classList.toggle('locked', T.s === 'stopped' && performance.now() < T.lockUntil);
  const show = T.s === 'stopped' && !!T.last;
  $('#pbar').hidden = !show;
  if (show) document.querySelectorAll('#pbar button').forEach(b => b.classList.toggle('on', b.dataset.p === T.last.penalty));
}

function newScramble() {
  scr = CUBES[S.cube].scramble();
  $('#scr').textContent = scr;
  $('#scr').classList.toggle('long', scr.length > 70);
}

function recordSolve(raw, pen) {
  const sess = cur();
  const s = { id: uid(), cubeType: S.cube, scramble: scr, rawTime: raw, penalty: pen, finalTime: finalOf(raw, pen), timestamp: Date.now() };
  sess.solves.push(s); T.last = s;
  const hit = checkPBs(sess.solves);
  save(); newScramble(); render();
  if (hit.length) { toast('New PB! ' + hit.join(', ')); beep(1100, .15); }
}
function setPenalty(p) {
  if (!T.last) return;
  T.last.penalty = p; T.last.finalTime = finalOf(T.last.rawTime, p);
  const hit = checkPBs(cur().solves);
  save(); render();
  if (hit.length) toast('New PB! ' + hit.join(', '));
}
function deleteSolve(id) {
  const sess = cur();
  sess.solves = sess.solves.filter(s => s.id !== id);
  if (T.last && T.last.id === id) T.last = null;
  save(); render();
}

function render() {
  $('#tabs').innerHTML = Object.keys(CUBES).map(c => `<button data-c="${c}" class="${c === S.cube ? 'on' : ''}">${CUBES[c].label}</button>`).join('');
  $('#ss').innerHTML = S.sessions.filter(x => x.cube === S.cube).map(x => `<option value="${x.id}" ${x.id === S.active[S.cube] ? 'selected' : ''}>${esc(x.name)} (${x.solves.length})</option>`).join('');
  const sv = cur().solves, f = sv.map(s => s.finalTime), sm = Stats.summary(f), a = v => v == null ? '—' : fmt(v);
  const cell = (l, v) => `<div><b>${v}</b><span>${l}</span></div>`;
  $('#quick').innerHTML = cell('Ao5', a(sm.ao5)) + cell('Ao12', a(sm.ao12)) + cell('Best', a(sm.best));
  $('#st').innerHTML = cell('Solves', sm.n) + cell('Best', a(sm.best)) + cell('Worst', a(sm.worst)) + cell('Mean', a(sm.mean)) +
    cell('Ao5', a(sm.ao5)) + cell('Ao12', a(sm.ao12)) + cell('Ao50', a(sm.ao50)) + cell('Ao100', a(sm.ao100));
  $('#pbh').textContent = CUBES[S.cube].label + ' Personal Records';
  $('#pb').innerHTML = PBK.map(([k, n]) => `<div class="pbr"><span>${n}</span><b>${a(S.pbs[S.cube][k])}</b></div>`).join('');
  $('#hist').innerHTML = '<tr><th>#</th><th class="r">Time</th><th>Penalty</th><th></th></tr>' + (sv.length ? sv.map((s, i) =>
    `<tr title="${esc(s.scramble)}"><td>${i + 1}</td><td class="r">${sd(s)}</td><td>${s.penalty}</td><td class="r"><button class="x" data-del="${s.id}" aria-label="Delete solve ${i + 1}">×</button></td></tr>`).reverse().join('') : '<tr><td colspan="4" class="mut">No solves yet</td></tr>');
  const v = f.filter(x => x != null);
  if (v.length < 2) $('#gr').innerHTML = '<p class="mut">Complete 2+ solves to see the trend.</p>';
  else {
    const mx = Math.max(...v), mn = Math.min(...v), r = mx - mn || 1, n = f.length, pts = [];
    f.forEach((x, i) => { if (x != null) pts.push((i / (n - 1) * 300).toFixed(1) + ',' + (96 - (x - mn) / r * 88).toFixed(1)); });
    $('#gr').innerHTML = `<svg class="gr" viewBox="0 0 300 100" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" fill="none" stroke="var(--acc)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="gl mut"><span>fastest ${fmt(mn)}</span><span>slowest ${fmt(mx)}</span></div>`;
  }
  draw();
}

let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }
function ask(msg, val) {
  return new Promise(res => {
    const d = $('#dlg'), i = $('#dinp'), text = val !== undefined;
    $('#dmsg').textContent = msg; i.hidden = !text; i.value = val || ''; d.returnValue = '';
    d.onclose = () => res(d.returnValue === 'ok' ? (text ? (i.value.trim() || null) : true) : null);
    d.showModal(); if (text) { i.focus(); i.select(); }
  });
}
const ACCENTS = { blue: '#3b82f6', green: '#16a34a', purple: '#8b5cf6', orange: '#ea580c', pink: '#db2777', teal: '#0d9488' };
const TCOLORS = Object.assign({ default: null, accent: 'var(--acc)' }, ACCENTS);
function applyTheme() {
  const st = S.settings, r = document.documentElement;
  if (['light', 'dark', 'black'].includes(st.theme)) r.dataset.theme = st.theme; else r.removeAttribute('data-theme');
  const acc = ACCENTS[st.accent] || ACCENTS.blue, tc = TCOLORS[st.tcolor];
  r.style.setProperty('--acc', acc);
  if (tc) r.style.setProperty('--tc', tc); else r.style.removeProperty('--tc');
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = acc;
}
function setCube(c) {
  if (c === S.cube || T.s === 'running' || !CUBES[c]) return;
  S.cube = c; save(); resetTimer(); newScramble(); render();
}
const modal = () => !!document.querySelector('dialog[open]');
const idleish = () => T.s === 'idle' || T.s === 'stopped';
