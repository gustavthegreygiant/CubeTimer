/* App-like behaviour: focus mode + screen wake lock, fullscreen, install button, orientation lock */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let focusOn = false, wake = null;

// Called every frame from draw(): hides the chrome and keeps the screen awake while a solve is active.
function setFocus(on) {
  if (on === focusOn) return;
  focusOn = on;
  document.body.classList.toggle('focus', on);
  if (on) { lockScreen(); if (typeof stopCelebrate === 'function') stopCelebrate(); } else { try { if (wake) wake.release(); } catch (e) {} wake = null; }
}
async function lockScreen() {
  try {
    if (!navigator.wakeLock) return;
    const w = await navigator.wakeLock.request('screen');
    if (focusOn) wake = w; else w.release();
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && focusOn) lockScreen(); });

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
