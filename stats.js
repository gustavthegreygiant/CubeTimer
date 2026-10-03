/* ============ Formatting + statistics ============ */
function fmt(ms, d = 2) {
  if (ms == null) return '—';
  if (!isFinite(ms)) return 'DNF';
  const per = d === 2 ? 100 : 10, t = Math.floor(ms / (d === 2 ? 10 : 100));
  const s = Math.floor(t / per), f = String(t % per).padStart(d, '0');
  const m = Math.floor(s / 60), ss = s % 60;
  return m ? `${m}:${String(ss).padStart(2, '0')}.${f}` : `${ss}.${f}`;
}
const finalOf = (raw, pen) => pen === 'DNF' ? null : raw + (pen === '+2' ? 2000 : 0);

const Stats = {
  // f: chronological finalTimes (null = DNF). Returns ms, Infinity (DNF) or null (not enough solves)
  avg(f, n) {
    if (f.length < n) return null;
    const w = f.slice(-n), tr = Math.ceil(n / 20);
    if (w.filter(x => x == null).length > tr) return Infinity;
    const v = w.map(x => x == null ? Infinity : x).sort((a, b) => a - b).slice(tr, n - tr);
    return v.reduce((a, b) => a + b, 0) / v.length;
  },
  summary(f) {
    const v = f.filter(x => x != null);
    return {
      n: f.length,
      best: v.length ? Math.min(...v) : null,
      worst: v.length ? Math.max(...v) : null,
      mean: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null,
      ao5: this.avg(f, 5), ao12: this.avg(f, 12), ao50: this.avg(f, 50), ao100: this.avg(f, 100)
    };
  }
};
