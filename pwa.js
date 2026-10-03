// Register the service worker so the app reloads offline (http/https only).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && typeof toast === 'function') toast('Update ready - reopen the app to use it');
  });
}
