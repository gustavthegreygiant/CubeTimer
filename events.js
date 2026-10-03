/* ============ Events ============ */
const onTimer = () => document.body.dataset.view === 'timer';
function showView(v) {
  document.body.dataset.view = v;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
$('#nav').onclick = e => { const v = e.target.dataset.v; if (v && !ACT.has(T.s)) showView(v); };
addEventListener('keydown', e => {
  if (modal() || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && onTimer()) timerDown(); }
  else if (e.repeat) return;
  else if (e.key === 'n' || e.key === 'N') { if (idleish() && onTimer()) newScramble(); }
  else if (e.key === 'Escape') resetTimer();
  else if (e.key === 'Delete') { if (T.s !== 'running') { const sv = cur().solves; if (sv.length) deleteSolve(sv[sv.length - 1].id); } }
});
addEventListener('keyup', e => {
  if (e.code === 'Space' && !modal() && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); timerUp(); }
});
addEventListener('pointerdown', e => {
  if (modal()) return;
  if (T.s === 'running') { timerDown(); return; }
  if (e.target.closest('#tz')) { e.preventDefault(); if (T.s === 'stopped' && performance.now() < T.lockUntil) return; timerDown(); }
});
addEventListener('pointerup', () => timerUp());
addEventListener('pointercancel', () => timerUp());
$('#tz').addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.blur(); });

$('#tabs').onclick = e => { if (e.target.dataset.c) setCube(e.target.dataset.c); };
$('#nsb').onclick = () => { if (idleish()) newScramble(); };
$('#pbar').onclick = e => { if (e.target.dataset.star) { if (T.last) toggleStar(T.last.id); } else if (e.target.dataset.p !== undefined) setPenalty(e.target.dataset.p); };
$('#hist').onclick = e => {
  const d = e.target.dataset;
  if (d.del) deleteSolve(d.del);
  else if (d.star) toggleStar(d.star);
  else { const r = e.target.closest('tr[data-open]'); if (r) { openId = openId === r.dataset.open ? null : r.dataset.open; render(); } }
};
$('#pb').onclick = e => { const b = e.target.closest('[data-pb]'); if (b) { openPB = openPB === b.dataset.pb ? null : b.dataset.pb; render(); } };
$('#hl').onclick = e => { if (e.target.dataset.star) toggleStar(e.target.dataset.star); };
$('#clr').onclick = async () => {
  if (!cur().solves.length || T.s === 'running') return;
  if (S.settings.confirmClear && !(await ask('Delete all solves in "' + cur().name + '"? This cannot be undone.'))) return;
  cur().solves = []; resetTimer(); save(); render();
};
$('#ss').onchange = e => { S.active[S.cube] = e.target.value; save(); resetTimer(); render(); };
$('#sn').onclick = async () => {
  const n = await ask('New session name', 'Session ' + (S.sessions.filter(x => x.cube === S.cube).length + 1));
  if (!n) return;
  const s = mkSession(S.cube, n); S.sessions.push(s); S.active[S.cube] = s.id; save(); resetTimer(); render();
};
$('#sr').onclick = async () => { const n = await ask('Rename session', cur().name); if (n) { cur().name = n; save(); render(); } };
$('#sd').onclick = async () => {
  if (!(await ask('Delete session "' + cur().name + '" and all its solves?'))) return;
  S.sessions = S.sessions.filter(x => x.id !== S.active[S.cube]);
  if (!S.sessions.some(x => x.cube === S.cube)) S.sessions.push(mkSession(S.cube, 'Session 1'));
  S.active[S.cube] = S.sessions.find(x => x.cube === S.cube).id;
  save(); resetTimer(); render();
};
$('#gear').onclick = () => {
  const s = S.settings;
  $('#s1').checked = s.insp; $('#s2').value = s.inspDur; $('#s3').value = s.disp; $('#s4').value = s.theme;
  $('#s5').checked = s.sound; $('#s6').checked = s.confirmClear; $('#s7').value = s.orient; $('#s8').value = s.accent; $('#s9').value = s.tcolor; $('#s10').value = String(s.lock); $('#s11').checked = s.celebrate;
  $('#sdlg').showModal();
};
$('#sdlg').addEventListener('change', () => {
  const s = S.settings;
  s.insp = $('#s1').checked; s.inspDur = Math.min(60, Math.max(5, Math.round(+$('#s2').value) || 15));
  s.disp = $('#s3').value; s.theme = $('#s4').value; s.sound = $('#s5').checked; s.confirmClear = $('#s6').checked;
  const o = $('#s7').value, oc = o !== s.orient; s.orient = o;
  s.accent = $('#s8').value; s.tcolor = $('#s9').value; s.lock = +$('#s10').value; s.celebrate = $('#s11').checked;
  save(); applyTheme(); draw(); if (oc) applyOrientation(true);
});

initState(); applyTheme(); newScramble(); render();
