# [OYUN ADI] — Strateji Oyunu

Dünya haritası üzerinde çok oyunculu web stratejisi. OGame tarzı panel arayüzü + Türkiye haritası (Leaflet, lazy loading).

## Canlı site

**https://stratejioyunu.vercel.app**

## Tanıtım PDF (kapsamlı)

`docs/Stratejioyunu-Kapsamli-Tanitim.pdf` — oyun mekaniği, tüm modüller, son revizyonlar, roadmap, AI bağlam belgesi.

Yeniden üretmek için: `npm run tanitim:kapsamli`

## Geliştirme

```bash
npm install
npm run dev
```

Tarayıcı: http://localhost:5173

## Deploy (otomatik)

`master` branch'e her push → GitHub Actions → Vercel production (`stratejioyunu.vercel.app`).

**İlk kurulum:** GitHub Actions secret `VERCEL_TOKEN` geçerli olmalı. Aksi halde workflow kırmızı kalır ve canlı site güncellenmez. Ayrıntı: [docs/DEPLOY.md](docs/DEPLOY.md)

Manuel deploy:

```bash
npm run deploy
```

## Repo

https://github.com/winegg420/stratejioyunu

## Durum

- UI / placeholder veriler (auth, Supabase, backend henüz yok)
- Harita: 81 il + ile tıklanınca ilçe lazy load
