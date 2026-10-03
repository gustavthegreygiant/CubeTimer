// Bump VERSION whenever you deploy changes so users get the new files.
const VERSION = 'cube-timer-v5';
const FILES = ['./', 'index.html', 'style.css', 'scrambler.js', 'stats.js', 'storage.js', 'timer.js', 'ui.js', 'events.js', 'app.js', 'pwa.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
