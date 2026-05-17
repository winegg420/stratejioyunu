# [OYUN ADI] — Strateji Oyunu

Dünya haritası üzerinde çok oyunculu web stratejisi. OGame tarzı panel arayüzü + Türkiye haritası (Leaflet, lazy loading).

## Canlı site

**https://stratejioyunu.vercel.app**

## Geliştirme

```bash
npm install
npm run dev
```

Tarayıcı: http://localhost:5173

## Deploy

```bash
npm run build
npx vercel deploy --prod --yes
```

## Repo

https://github.com/winegg420/stratejioyunu

## Durum

- UI / placeholder veriler (auth, Supabase, backend henüz yok)
- Harita: 81 il + ile tıklanınca ilçe lazy load
