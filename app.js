/* App-like behaviour: focus mode + screen wake lock, fullscreen, install button, orientation lock */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let focusOn = false, wake = null, acquiring = false, interacted = false, warned = false;
// Screen stays awake during a solve, and also on the Timer tab unless Battery saver mode is ON.
const wantAwake = () => document.visibilityState === 'visible' && (focusOn || (!S.settings.saver && document.body.dataset.view === 'timer'));
async function syncWake() {
  if (!navigator.wakeLock) return;
  if (!wantAwake()) { try { if (wake) await wake.release(); } catch (e) {} wake = null; return; }
  if (wake || acquiring) return;
  acquiring = true;
  try {
    const w = await navigator.wakeLock.request('screen');
    w.addEventListener('release', () => { if (wake === w) wake = null; });
    if (wantAwake()) wake = w; else w.release();
  } catch (e) {
    if (interacted && !warned && !S.settings.saver) { warned = true; toast("Couldn't keep the screen on - is your phone's battery saver on?"); }
  }
  acquiring = false;
}
function setFocus(on) {
  if (on === focusOn) return;
  focusOn = on;
  document.body.classList.toggle('focus', on);
  if (on && typeof stopCelebrate === 'function') stopCelebrate();
  syncWake();
}
document.addEventListener('visibilitychange', syncWake);
addEventListener('pointerdown', () => { interacted = true; if (!wake) syncWake(); }, { passive: true });

// Fullscreen (Android/desktop; hidden when unsupported or already installed)
if (!document.documentElement.requestFullscreen || isStandalone()) $('#fs').hidden = true;
$('#fs').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };

// Install button
let installEvt;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#inst').hidden = false; });
$('#inst').onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; $('#inst').hidden = true; };
addEventListener('appinstalled', () => { $('#inst').hidden = true; });

// Orientation: 'auto' follows the phone's rotation; portrait/landscape lock (Android: installed app or fullscreen)
async function applyOrientation(userAction) {
  const o = S.settings.orient, so = screen.orientation;
  try {
    if (!so || !so.lock) throw new Error('unsupported');
    if (o === 'auto') { so.unlock(); return; }
    if (!isStandalone() && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    await so.lock(o);
  } catch (e) { if (userAction && o !== 'auto') toast('Rotation lock needs the installed app or fullscreen'); }
}
if (S.settings.orient !== 'auto' && isStandalone()) applyOrientation(false);

// Update from GitHub: re-download every file bypassing caches, drop the service worker + caches, reload.
// Solves and settings live in localStorage, which is untouched.
async function updateApp() {
  const btn = $('#upd');
  if (!navigator.onLine) return toast('You are offline');
  btn.disabled = true; btn.textContent = 'Updating…';
  try {
    const urls = [...new Set([...document.querySelectorAll('script[src],link[href]')].map(x => x.src || x.href)
      .concat(['sw.js', './'].map(u => new URL(u, location.href).href)))];
    const rs = await Promise.all(urls.map(u => fetch(u, { cache: 'reload' })));
    if (rs.some(r => !r.ok)) throw new Error('bad response');
    if ('serviceWorker' in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
    if (window.caches) await Promise.all((await caches.keys()).map(k => caches.delete(k)));
    location.reload();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Update app';
    toast("Couldn't reach GitHub. Nothing was changed.");
  }
}
$('#upd').onclick = updateApp;

syncWake();
