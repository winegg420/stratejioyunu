/** index.html — build meta + tek seferlik PWA temizliği (kullanıcı müdahalesi yok) */
const SW_PURGE_VERSION = '45';

export function injectBuildMeta() {
  const buildId = new Date().toISOString();
  const purgeScript = `
    <script>
    (function () {
      var key = 'stratejioyunu:sw-purge';
      var ver = '${SW_PURGE_VERSION}';
      try {
        if (localStorage.getItem(key) === ver) return;
        localStorage.setItem(key, ver);
        var unregister = function () {
          if (!navigator.serviceWorker) return Promise.resolve();
          return navigator.serviceWorker.getRegistrations().then(function (regs) {
            return Promise.all(regs.map(function (r) { return r.unregister(); }));
          });
        };
        var clearCaches = function () {
          if (!window.caches) return Promise.resolve();
          return caches.keys().then(function (names) {
            return Promise.all(names.map(function (n) { return caches.delete(n); }));
          });
        };
        Promise.all([unregister(), clearCaches()]).then(function () {
          window.location.reload();
        });
      } catch (e) { /* ignore */ }
    })();
    </script>`;

  return {
    name: 'inject-build-meta',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta name="app-build" content="${buildId}" />${purgeScript}\n    <link rel="manifest" href="/manifest.webmanifest" />`,
      );
    },
  };
}
