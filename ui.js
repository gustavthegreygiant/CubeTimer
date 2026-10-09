/* ============ UI ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let openId = null, openPB = null;
const COPY_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
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
  if (show) document.querySelectorAll('#pbar button').forEach(b => { if (b.dataset.star) { b.classList.toggle('on', !!T.last.star); b.textContent = T.last.star ? '★' : '☆'; } else b.classList.toggle('on', b.dataset.p === T.last.penalty); });
}

function newScramble() {
  scr = CUBES[S.cube].scramble();
  $('#scr').textContent = scr;
  $('#scr').classList.toggle('long', scr.length > 70);
  $('#scr').classList.toggle('xl', scr.length > 160);
}

function recordSolve(raw, pen) {
  const sess = cur();
  const s = { id: uid(), cubeType: S.cube, scramble: scr, rawTime: raw, penalty: pen, finalTime: finalOf(raw, pen), timestamp: Date.now() };
  sess.solves.push(s); T.last = s;
  const hit = checkPBs(sess.solves);
  save(); newScramble(); render();
  if (hit.length) { celebrate(hit); beep(1100, .15); }
}
function setPenalty(p) {
  if (!T.last) return;
  T.last.penalty = p; T.last.finalTime = finalOf(T.last.rawTime, p);
  const hit = rebuildPBs(S.cube);
  save(); render();
  if (hit.length) celebrate(hit);
}
function deleteSolve(id) {
  const sess = cur();
  sess.solves = sess.solves.filter(s => s.id !== id);
  if (T.last && T.last.id === id) T.last = null;
  rebuildPBs(S.cube);
  save(); render();
}

function render() {
  $('#tabs').innerHTML = Object.keys(CUBES).map(c => `<button data-c="${c}" class="${c === S.cube ? 'on' : ''}">${CUBES[c].label}</button>`).join('');
  { const tb = $('#tabs'), on = tb.querySelector('.on'); if (on) tb.scrollLeft = on.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2; }
  $('#ss').innerHTML = S.sessions.filter(x => x.cube === S.cube).map(x => `<option value="${x.id}" ${x.id === S.active[S.cube] ? 'selected' : ''}>${esc(x.name)} (${x.solves.length})</option>`).join('');
  const sv = cur().solves, f = sv.map(s => s.finalTime), sm = Stats.summary(f), a = v => v == null ? '—' : fmt(v);
  const cell = (l, v) => `<div><b>${v}</b><span>${l}</span></div>`;
  $('#rc').innerHTML = sv.length ? sv.slice(-8).reverse().map((s, i) => `<span class="chip${i ? '' : ' new'}">${sd(s)}${s.penalty === '+2' ? '<i>+2</i>' : ''}</span>`).join('') : '<span class="mut">No solves yet</span>';
  $('#quick').innerHTML = cell('Ao5', a(sm.ao5)) + cell('Ao12', a(sm.ao12)) + cell('Best', a(sm.best));
  $('#st').innerHTML = cell('Solves', sm.n) + cell('Best', a(sm.best)) + cell('Worst', a(sm.worst)) + cell('Mean', a(sm.mean)) +
    cell('Ao5', a(sm.ao5)) + cell('Ao12', a(sm.ao12)) + cell('Ao50', a(sm.ao50)) + cell('Ao100', a(sm.ao100));
  $('#pbh').textContent = CUBES[S.cube].label + ' Personal Records';
  const pbs = S.pbs[S.cube], dt = ts => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const sc = x => `<div class="scs">${esc(x || '')}</div>`;
  $('#pb').innerHTML = PBK.map(([k, n]) => {
    const r = pbs[k]; let det = '';
    if (r && openPB === k) det = '<div class="det">' + (r.ts ? dt(r.ts) : 'Set before details were recorded') +
      (r.solves || []).map((x, i) => `<div class="ds"><b>${r.solves.length > 1 ? (i + 1) + '. ' : ''}${x.pen === 'DNF' ? 'DNF' : fmt(x.t)}${x.pen === '+2' ? ' +2' : ''}</b>${sc(x.sc)}</div>`).join('') + (k === 'single' && r.solves && r.solves[0] && r.solves[0].sc ? `<button class="cp" data-copypb="single">${COPY_ICON} Copy</button>` : '') + '</div>';
    return `<div class="pbw"><button class="pbr" data-pb="${k}" ${r ? '' : 'disabled'}><span>${n}</span><b>${a(r && r.v)}</b></button>${det}</div>`;
  }).join('');
  const hl = S.sessions.filter(x => x.cube === S.cube).flatMap(x => x.solves.filter(s => s.star).map(s => Object.assign({ sn: x.name }, s))).sort((p, q) => q.timestamp - p.timestamp);
  $('#hl').innerHTML = hl.length ? hl.map(s => `<div class="hlr"><div class="hlt"><b>${sd(s)}</b><span class="mut">${dt(s.timestamp)} · ${esc(s.sn)}</span><button class="x" data-copy="${s.id}" aria-label="Copy solve">${COPY_ICON}</button><button class="x" data-star="${s.id}" aria-label="Remove star">★</button></div>${sc(s.scramble)}</div>`).join('') : '<p class="mut">Tap ☆ after a solve (or in the history) to keep a good solve and its scramble here.</p>';
  $('#hist').innerHTML = '<tr><th>#</th><th class="r">Time</th><th>Penalty</th><th></th><th></th><th></th></tr>' + (sv.length ? sv.map((s, i) =>
    `<tr class="hr" data-open="${s.id}"><td>${i + 1}</td><td class="r">${sd(s)}</td><td>${s.penalty}</td><td><button class="x" data-star="${s.id}" aria-label="Star solve ${i + 1}">${s.star ? '★' : '☆'}</button></td><td><button class="x" data-copy="${s.id}" aria-label="Copy solve ${i + 1}">${COPY_ICON}</button></td><td class="r"><button class="x" data-del="${s.id}" aria-label="Delete solve ${i + 1}">×</button></td></tr>` +
    (openId === s.id ? `<tr class="dtr"><td colspan="6">${dt(s.timestamp)}${sc(s.scramble)}</td></tr>` : '')).reverse().join('') : '<tr><td colspan="6" class="mut">No solves yet</td></tr>');
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
function ask(msg, val, danger) {
  return new Promise(res => {
    const d = $('#dlg'), i = $('#dinp'), text = val !== undefined, ok = d.querySelector('button[value="ok"]');
    ok.style.background = ok.style.borderColor = danger ? 'var(--bad)' : '';
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

function toggleStar(id) {
  for (const s of S.sessions) { const x = s.solves.find(v => v.id === id); if (x) { x.star = !x.star; break; } }
  save(); render();
}

/* PB celebration: trophy + confetti. Never blocks touches; stops when the next solve begins. */
function stopCelebrate() {
  clearTimeout(celebrate.t); cancelAnimationFrame(celebrate.raf);
  $('#fx').classList.remove('show');
  const g = $('#fxc').getContext && $('#fxc').getContext('2d'); if (g) g.clearRect(0, 0, $('#fxc').width, $('#fxc').height);
}
function celebrate(names) {
  if (!S.settings.celebrate) return;
  stopCelebrate();
  $('#fxt').textContent = 'New PB! ' + names.join(' · ');
  $('#fx').classList.add('show');
  celebrate.t = setTimeout(stopCelebrate, 4300);
  const c = $('#fxc'), g = c.getContext && c.getContext('2d');
  if (!g || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ff3b6b', '#ffd400', '#22d3ee', '#7c3aed', '#22c55e', '#ff7a00', '#3b82f6'];
  const W = innerWidth, H = innerHeight, ps = [];
  const mk = (x, y, vx, vy) => ({ x, y, vx, vy, s: 7 + Math.random() * 9, r: Math.random() * 6, vr: (Math.random() - .5) * .45, c: cols[Math.floor(Math.random() * cols.length)] });
  for (let i = 0; i < 260; i++) { const an = Math.random() * Math.PI * 2, v = 4 + Math.random() * 15; ps.push(mk(W / 2, H * .5, Math.cos(an) * v, Math.sin(an) * v - 4)); }  // burst from the middle
  for (let i = 0; i < 100; i++) { ps.push(mk(0, H, 6 + Math.random() * 12, -(14 + Math.random() * 14))); ps.push(mk(W, H, -(6 + Math.random() * 12), -(14 + Math.random() * 14))); }  // side cannons
  const t0 = performance.now();
  (function step(now) {
    const t = now - t0;
    g.clearRect(0, 0, c.width, c.height);
    if (t < 2200) for (let i = 0; i < 7; i++) ps.push(mk(Math.random() * W, -20, (Math.random() - .5) * 3, 2 + Math.random() * 4));  // confetti rain
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.vy += .3; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > H + 40) { ps.splice(i, 1); continue; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); g.restore();
    }
    if (t < 4000) celebrate.raf = requestAnimationFrame(step); else g.clearRect(0, 0, c.width, c.height);
  })(t0);
}

/* ---- copy solve / PB single to the clipboard ---- */
async function copyText(t) {
  let ok = true;
  try { await navigator.clipboard.writeText(t); }
  catch (e) {
    const a = document.createElement('textarea');
    a.value = t; a.style.cssText = 'position:fixed;opacity:0;-webkit-user-select:text;user-select:text';
    document.body.appendChild(a); a.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    a.remove();
  }
  toast(ok ? 'Copied' : "Couldn't copy");
}
function copyBlock(head, t, pen, ts, sc) {
  const time = pen === 'DNF' ? 'DNF' : fmt(t) + (pen === '+2' ? ' (+2)' : '');
  return `${head}\nTime: ${time}\nDate: ${new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\nScramble: ${sc}`;
}
function copySolve(id) {
  let s = id === 'last' ? T.last : null;
  for (const x of S.sessions) { if (s) break; s = x.solves.find(v => v.id === id) || null; }
  if (s) copyText(copyBlock(CUBES[s.cubeType].label + ' solve', s.finalTime, s.penalty, s.timestamp, s.scramble));
}
function copyPB(k) {
  const r = S.pbs[S.cube][k], x = r && r.solves && r.solves[0];
  if (x) copyText(copyBlock(CUBES[S.cube].label + ' PB ' + k, x.t, x.pen, r.ts, x.sc));
}
