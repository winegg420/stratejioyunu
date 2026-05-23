# Canlı site deploy (Vercel)

**Canlı URL:** https://stratejioyunu.vercel.app

## Otomatik deploy (her `master` push)

GitHub Actions workflow: `.github/workflows/deploy.yml`

1. `master` branch'e push
2. Build + `vercel deploy --prod`
3. Canlı bundle doğrulanır (`lang-switcher` kontrolü)

### Tek seferlik kurulum (zorunlu)

GitHub repo → **Settings → Secrets and variables → Actions** → şu secret'ları ekleyin/güncelleyin:

| Secret | Nereden alınır |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create** → Full Account veya en azından Deploy |
| `VITE_SUPABASE_URL` | Supabase proje ayarları (varsa) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (varsa) |

`VERCEL_TOKEN` geçersizse workflow **kırmızı** kalır ve canlı site **güncellenmez** (eski davranış: yeşil tik ama deploy yok).

### İsteğe bağlı: Vercel ↔ GitHub bağlantısı

Vercel Dashboard → **stratejioyunu** → Settings → **Git** → Connect **winegg420/stratejioyunu**

Bağlandıktan sonra push'lar Vercel tarafında da tetiklenebilir (Actions ile birlikte veya yerine).

## Yerel acil deploy

```bash
npm run deploy
```

Vercel CLI ile giriş yapılmış olmalı (`npx vercel login`).

## Sorun giderme

- Site eski görünüyorsa: **Ctrl+Shift+R** veya gizli pencere (PWA önbelleği).
- Actions kırmızı + `VERCEL_TOKEN`: secret'ı yenileyin.
- Son başarılı deploy: [Vercel Dashboard](https://vercel.com/idagureli-4647s-projects/stratejioyunu)
