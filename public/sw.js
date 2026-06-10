/* Kill-switch service worker.
 * Eski PWA döneminden kalan service worker'lar /sw.js'i güncellemeye çalışır;
 * bu dosya yokken Vercel rewrite HTML döndürüyordu ve güncelleme reddediliyordu —
 * telefonlar eski önbellekte kilitli kalıyordu. Bu SW kurulur kurulmaz tüm
 * cache'leri siler, kendini kaldırır ve açık sekmeleri yeniler.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch (e) { /* cache erişimi yoksa geç */ }
    try {
      await self.registration.unregister();
    } catch (e) { /* zaten kayıtsızsa geç */ }
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) { /* sekme kapanmış olabilir */ }
    }
  })());
});
/* fetch handler bilerek yok — tüm istekler doğrudan ağa gider */
