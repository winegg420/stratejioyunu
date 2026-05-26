/** index.html — build meta + tek seferlik PWA temizliği (kullanıcı müdahalesi yok) */
const SW_PURGE_VERSION = '87';

export function injectBuildMeta() {
  const buildId = new Date().toISOString();
  const purgeScript = `
    <script>
    (function () {
      var key = 'stratejioyunu:sw-purge';
      var ver = '${SW_PURGE_VERSION}';
      var done = false;
      try { done = localStorage.getItem(key) === ver; } catch (e) { /* private mode */ }
      if (!done) {
        try { done = sessionStorage.getItem(key) === ver; } catch (e2) { /* ignore */ }
      }
      if (done) return;
      try { sessionStorage.setItem(key, ver); } catch (e3) { /* ignore */ }
      try { localStorage.setItem(key, ver); } catch (e4) { /* ignore */ }
      var unregister = function () {
        if (!navigator.serviceWorker) return Promise.resolve(0);
        return navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.unregister(); })).then(function () {
            return regs.length;
          });
        });
      };
      var clearCaches = function () {
        if (!window.caches) return Promise.resolve();
        return caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        });
      };
      Promise.all([unregister(), clearCaches()]).catch(function () { /* purge optional */ });
    })();
    </script>`;

  const bootFallback = `
    <div id="app-boot-fallback" class="app-boot-fallback" role="status" aria-live="polite">
      <p class="app-boot-fallback__title">Strateji Oyunu</p>
      <p class="app-boot-fallback__sub">Komuta merkezi yükleniyor…</p>
      <p class="app-boot-fallback__hint">Takılı kalırsa Ctrl+Shift+R ile sert yenileyin.</p>
    </div>`;

  return {
    name: 'inject-build-meta',
    transformIndexHtml(html) {
      const withRoot = html.replace(
        '<div id="root"></div>',
        `<div id="root">${bootFallback}</div>`,
      );
      return withRoot.replace(
        '<head>',
        `<head>\n    <meta name="app-build" content="${buildId}" />${purgeScript}\n    <link rel="manifest" href="/manifest.webmanifest" />`,
      );
    },
  };
}
