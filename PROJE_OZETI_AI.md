# Stratejioyunu — Yapay Zeka İçin Proje Özeti

> Bu belge, projeyi **kod dosyalarına bakmadan** anlamak isteyen bir yapay zekaya verilmek üzere hazırlanmıştır.  
> Geliştirici (İda) bu projeyi Cursor + Claude/Gemini ile iteratif olarak geliştiriyor. Canlı siteyi de inceleyebilirsin: **https://stratejioyunu.vercel.app**

---

## 1. Proje Nedir?

**Stratejioyunu**, tarayıcıda oynanan, **OGame / Travian tarzı** bir **uzay-yer (4X-lite) strateji oyunu** prototipidir. Türkiye odaklı bir sunucu teması vardır (“Türkiye-1 Sezon”). Oyuncu:

- Şehir kurar / yönetir (kaynak, bina, araştırma, ordu),
- Harita üzerinde şehirlere saldırır, casusluk yapar, ticaret ve sefer yönetir,
- Panel tabanlı menülerle (sol sidebar) modüller arasında gezinir.

**Önemli:** Backend ve gerçek çok oyunculu sunucu **henüz yok**. Oyun state’i büyük ölçüde **istemci tarafında (Zustand)** ve **placeholder/demo verilerle** çalışır. Supabase auth altyapısı hazırlanmış ama tam entegre değil.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| UI | React 19 + React Router 7 |
| Build | Vite 8 + PWA (service worker) |
| Harita | Leaflet + react-leaflet |
| State | Zustand (tek merkez: `gameStore.js`) |
| Stil | Vanilla CSS (`index.css`, `hud-shell.css`) — Tailwind yok |
| Auth (hazırlık) | Supabase client |
| Deploy | GitHub → Vercel (`stratejioyunu.vercel.app`) |
| Repo | https://github.com/winegg420/stratejioyunu |

---

## 3. Mimari — Dosyalar Nerede?

```
src/
  App.jsx              → Rotalar (/binalar, /harita, /kisla, …)
  components/          → UI parçaları (ResourceBar, BuildingCard, Layout…)
  pages/               → Sayfa kabukları (Buildings, MapPage, Barracks…)
  stores/gameStore.js  → ANA OYUN MOTORU (kuyruk, sefer, saldırı, kaynak tick)
  data/
    placeholder.js     → Demo şehirler, binalar, birimler, harita şehirleri
    gameInit.js        → Başlangıç state (izmir + çeşme, tüm binalar sv.0)
    buildingCatalog.js → Seviye bazlı inşaat maliyet/süre (Sv.0→1 kritik)
    buildingVisualCatalog.js → Bina kartı görselleri
    unitCatalog.js     → Birim görünen isimleri (fütüristik kod adları)
  map/                 → Türkiye haritası, pinler, sis, sefer rotaları
  lib/                 → Saf mantık (savaş, ganimet, VIP, temizlik, menzil…)
```

**Tek gerçek kaynak:** `gameStore` + `now` ticker. Sayfalar store’dan okur, aksiyonlar store fonksiyonlarını çağırır.

---

## 4. Oyun Döngüsü (Mantık)

### 4.1 Şehir ve kaynaklar
- Oyuncunun birden fazla şehri olabilir (`playerCities`: örn. İzmir, Çeşme).
- **Aktif şehir** üst bardaki dropdown ile seçilir (`activeCityId`).
- Kaynaklar: Yemek, Yakıt, Metal, Enerji, Para. Üretim bina seviyelerine bağlı.
- **İşçi/nüfus cezası:** Yetersiz nüfusta maden üretimi düşer.
- **Depo taşması:** Depo dolunca üretim donar (görsel uyarılar var).

### 4.2 Binalar (`/binalar`)
- Tüm binalar başlangıçta **seviye 0** (kurulmamış).
- **Merkez Bina (hq)** önce inşa edilmeli; diğer binaların ön koşulları var.
- Aynı anda **1 aktif inşaat**, fazlası kuyruğa girer.
- Maliyet/süre artık `buildingCatalog.js` → `levels[1]` üzerinden gelir (eski `cost: "—"` hatası giderildi).
- Bina kartlarında **askeri-endüstriyel görseller** ve İngilizce teknik alt yazı (designation) var.

### 4.3 Ordu ve üretim
- Kışla / Hava Üssü / Tersane kilitli; ilgili bina inşa edilince açılır.
- Birim üretimi kuyruk mantığı (constructionQueue benzeri `productionQueue`).

### 4.4 Harita (`/harita`)
- Türkiye GeoJSON: 81 il, ile tıklanınca ilçe lazy-load.
- Şehir pinleri: kendi / düşman / boş. **Aktif şehir** parlak yeşil HQ pini + radar animasyonu.
- **Menzil çemberi** (~250 km) aktif şehir etrafında.
- **Üsse odaklan** butonu + açılışta `setView` ile aktif şehre zoom.
- Sis perdesi: kendi şehirler, casusluk ve seferlerle görüş alanları.
- Sefer rotaları: saldırı (kırmızı), casus (sarı), dönüş; canlı animasyon.

### 4.5 Seferler, savaş, raporlar
- Seferler mesafe + süre hesabıyla (`expeditionTravel.js`).
- Savaş simülatörü (`battleSimulator.js`), raporlar, ganimet (`lootUtils.js`).
- Gelen saldırılar, Meydan savaşı paneli gibi sistemler UI’da mevcut.

### 4.6 Meta sistemler (ileri)
- **VIP Atma / Prestige:** Sunucu sıfırlama, kalıcı bonus.
- **Server cleansing:** 14+ gün inaktif hesapların şehirleri “hayalet” → boş arazi.
- Oyuncu aktivitesi registry ile takip.

---

## 5. Görsel ve UX Stratejisi

- **Tema:** 2026 “siber askeri HUD” — koyu lacivert/siyah, neon **değil**; fonksiyonel LED yeşil/mavi/amber iş ışıkları.
- **Harita:** Carto dark matter tile, cyber grid arka plan (`hud-shell.css`).
- **Referans oyun hissi:** OGame panel akışı (kaynak bar üstte, sol menü, kart grid).
- **Bina görselleri:** Tek bir konsept kompozit görselden (AI üretimi) 6 parçaya bölündü → `public/buildings/*.jpg`. Kışla görseli ayrıca gerçekçi komuta binası olarak yenilendi.
- **Birim isimleri:** Türkçe operasyonel isim + İngilizce designation alt satır (ör. “Gölge Operasyon Timi”).

---

## 6. Gemini / Dış Kaynaklardan Ne “Kopyalandı”?

| Kaynak | Ne alındı | Ne alınmadı |
|--------|-----------|-------------|
| Gemini / görsel AI | Bina konsept görselleri (kışla, hava üssü, tersane, araştırma, maden, depo) — karanlık harita üzerine askeri-endüstriyel stil | Oyun motoru, kod mimarisi |
| OGame (referans) | Panel yapısı, kaynak bar, bina kuyruğu, sefer mantığı fikri | Birebir UI veya asset |
| Claude / Cursor sohbetleri | Hata ayıklama, deploy, harita HUD spesifikasyonları, buildingCatalog tasarımı | — |
| Leaflet / Carto | Harita tile ve GeoJSON pattern | — |

**Kritik:** Oyun **orijinal kod tabanı**; placeholder veriler geliştirme içindir, production ekonomisi dengelenmemiştir.

---

## 7. Son Dönemde Yapılanlar (Kronolojik Özet)

1. **Global gameStore** — Canlı sefer, rapor, kuyruk senkronu.
2. **Siber harita paketi** — Sis, neon rotalar, şehir paneli, sefer ETA.
3. **Ekonomi revizyonu** — Yeni oyuncu kaynakları, üretim dondurma, mesafe bazlı sefer.
4. **Premium HUD cilası** — Cyber butonlar, kilitli bina kartları, mono tipografi.
5. **VIP + server cleansing** — End-game meta.
6. **Harita çöküş fix** — `setMaxBoundsViscosity` kaldırıldı.
7. **PWA cache fix** — SW güncelleme, index.html no-cache.
8. **Deploy pipeline** — GitHub Actions + Vercel token; yerel CLI deploy yedek.
9. **Harita konum HUD** — Aktif şehir pini, menzil çemberi, odaklan, `CityMarkers` + `playerCities` koordinat eşlemesi.
10. **Binalar sayfası layout** — Grid, z-index, harita katmanı sızıntısı engellendi.
11. **buildingCatalog** — Seviye 0 binalar için Sv.1 maliyet; İNŞA ET çalışır.
12. **Bina görsel kataloğu** — 6 bina JPG + kart UI.
13. **Kışla görsel wrap** — `building-img-wrap` 180px, taşma fix.

---

## 8. Bilinen Sınırlamalar / Yapılmayanlar

- Gerçek multiplayer, websocket, sunucu authoritative simülasyon **yok**.
- Persistans: çoğunlukla session/local; Supabase tam oyun kaydı yok.
- Diplomasi, mesajlar → çoğunlukla UI placeholder.
- Ekonomi ve savaş dengesi **test edilmedi**.
- `[OYUN ADI]` placeholder metinleri hâlâ değiştirilebilir.
- Tüm binaların Sv.2+ maliyetleri katalogda ölçek formülüyle; ayrıntılı denge tablosu yok.

---

## 9. Deploy ve Geliştirme

```bash
npm install && npm run dev    # localhost:5173
git push origin master        # → GitHub Actions → Vercel production
```

- Canlı: https://stratejioyunu.vercel.app  
- Giriş sayfası: `/giris` (auth demo)  
- Ana oyun: giriş sonrası `/` ve alt rotalar  

**Cache notu:** PWA kullanıldığı için eski bundle görülebilir → hard refresh veya SW unregister.

---

## 10. Geliştiriciden Yapay Zekaya Beklenti

İda şunları istiyor:

1. Canlı siteyi gezip **UX/UI ve oyun tasarımı** önerileri sunmanı.
2. Mevcut sistemleri (harita, bina, sefer, ekonomi) **tutarlı bir oyun tasarım belgesine** bağlamanı.
3. “Sıradaki 3 özellik” veya “yeni oyuncu onboarding” için **önceliklendirilmiş roadmap**.
4. Placeholder’dan **gerçek oyuna** geçiş için teknik öneri (Supabase şema, tick server, vs.).
5. **Kod yazmadan önce** önce strateji/konsept konuşmayı tercih ediyor; kod önerileri somut dosya yollarıyla gelsin.

**Dil:** Türkçe yanıt tercih edilir. Teknik terimler İngilizce kalabilir.

---

## 11. Hızlı Test Senaryosu (Canlı Sitede)

1. Giriş yap → Ana sayfa kaynakları gör.
2. `/binalar` → Merkez Bina maliyetini gör → İNŞA ET (kaynak yetiyorsa).
3. Üst bardan şehir değiştir → `/harita` → Aktif şehir pini + çember + odaklan.
4. `/kisla` → Kışla inşa edilmeden kilitli olduğunu gör.
5. `/seferler` → Aktif sefer listesi (demo veri olabilir).

---

## 12. Önemli Dosya Referansları (İsteğe Bağlı Derinlik)

| Konu | Dosya |
|------|--------|
| Ana state | `src/stores/gameStore.js` |
| Başlangıç | `src/data/gameInit.js` |
| Bina maliyet | `src/data/buildingCatalog.js` |
| Bina UI | `src/components/BuildingCard.jsx` |
| Harita | `src/map/TurkeyMap.jsx`, `src/map/CityMarkers.jsx` |
| Menzil | `src/lib/mapRange.js` |
| Ön koşullar | `src/lib/buildingUtils.js` → `BUILDING_PREREQUISITES` |

---

*Belge sürümü: 2026-05 — commit `d78e725` civarı.*
