# STRATEJİ OYUNU
## Küresel Başkanlık (2044) — Kapsamlı Proje & Oyun Tasarım Belgesi

**Belge türü:** Tanıtım PDF · AI bağlam belgesi · Yatırımcı/ekip sunumu  
**Sürüm:** Mayıs 2026 · Geliştirme önizlemesi (Türkiye-1 Sezon)  
**Canlı:** https://stratejioyunu.vercel.app  
**Kaynak:** https://github.com/winegg420/stratejioyunu  

> **Yapay zeka için not:** Bu belge, kod dosyalarına erişmeden projenin tamamını anlamak üzere yazılmıştır. Mekanikler `src/stores/gameStore.js` ve `src/lib/*` modüllerinde uygulanır; UI rotaları `src/App.jsx` içindedir. Placeholder ve demo veriler üretim dengesini yansıtmayabilir.

---

## 1. Yönetici Özeti

**Stratejioyunu**, tarayıcıda oynanan, **OGame / Travian** tarzı kaynak–bina–ordu–harita döngüsünü **jeopolitik liderlik simülasyonu** ile birleştiren bir **4X-lite MMO prototipidir**. Oyuncu klasik bir “komutan” değil; seçimsiz, meclissiz **tek yetkili Devlet Başkanı (President)** rolündedir.

**Temel farklar:**
- Türkiye **gerçek il polygon haritası** (Leaflet + GeoJSON)
- **2044 siber-askeri komuta terminali** arayüzü (HUD, typewriter brifing)
- **Dört ideoloji** × sayısal üretim/ticaret/savaş çarpanları + sadakat liderlik tablosu
- **State Mail** (resmi şifreli yazışma; genel sohbet değil)
- Entegre **siber + yapay zeka + KBRN** üçgeni
- Son dönemde eklenen: **imparatorluk hazinesi**, **açık pazar**, **diplomatik anlaşmalar**, **kara borsa**, **savaş göçü**, **ittifak operasyonları**, **TR/EN dil**

**Teknik durum:** Çoğu simülasyon **istemci tarafında (Zustand)**; Supabase auth ve kısmi bulut senkronu hazır; tam sunucu otoriteli multiplayer henüz üretim seviyesinde değil.

---

## 2. Canlı Erişim ve Deploy

| Öğe | Değer |
|-----|--------|
| Production URL | https://stratejioyunu.vercel.app |
| Giriş | `/giris` |
| Ana oyun | `/` (giriş sonrası) |
| Deploy | Vercel (`npm run deploy` veya GitHub Actions) |
| PWA | Service worker; sert yenileme gerekebilir (Ctrl+Shift+R) |

**Deploy notu:** GitHub Actions için `VERCEL_TOKEN` secret geçerli olmalı; aksi halde workflow kırmızı kalır ve canlı site güncellenmez. Ayrıntı: `docs/DEPLOY.md`.

---

## 3. Oyun Vizyonu ve Tema

### 3.1 Dünya görünümü
- Zaman: **2044**, küresel kriz sonrası
- Sunucu teması: **Türkiye-1 Sezon**
- Oyuncu kimliği: President / Küresel Başkanlık
- Arayüz: koyu lacivert–siyah zemin, cyan/yeşil HUD; okunaklı **Rajdhani + Titillium Web** (başlık), **Share Tech Mono** (sayılar/terminal)

### 3.2 Ana hedefler (oyuncu perspektifi)
1. **Ekonomik:** Kaynak üret, depola, ticaret et, vergi ile bütçe yönet
2. **Askeri:** Kara/hava/deniz birlikleri üret, operasyon başlat, fethet veya savun
3. **Jeopolitik:** İdeoloji seç, sadakat kazan, diplomasi ve anlaşmalar
4. **Harita:** Türkiye üzerinde şehirler, menzil, sis, rotalar
5. **Meta:** Sezon görevleri, VIP, Devlet Tarih Kitabı, liderlik tablosu

---

## 4. Kaynaklar ve Ekonomi

### 4.1 Kaynak türleri (UI etiketleri)
| ID | Türkçe | Rol |
|----|--------|-----|
| food | Nüfus | İş gücü, tüketim, mutluluk baskısı |
| fuel | Petrol | Lojistik, sefer, endüstri |
| hammadde | Hammadde | İnşaat, üretim, pazar |
| energy | Enerji | Ar-Ge, siber, YZ merkezi |
| money | Bütçe | İnşaat, ticaret, diplomasi |
| uranium | Uranyum | İleri / KBRN (kilitli içerik) |

### 4.2 Üretim kuralları
- Üretim **bina seviyelerine**, ideoloji çarpanlarına, mutluluğa ve aktif krizlere bağlı
- **Depo dolunca** ilgili üretim durur (STGN göstergesi)
- **Nüfus/ işçi yoksa** maden üretimi ~%90 düşer
- **Vergi (Maliye):** Gelir artar, mutluluk düşer

### 4.3 İmparatorluk hazinesi (yeni)
- Tüm kolonilerin paylaştığı **ortak dijital bütçe** (empire treasury)
- Kaynak çubuğunda `[ ORTAK ]` rozeti
- Modül: `src/lib/empireTreasury.js`

### 4.4 Pazar sistemleri

#### Açık hammadde pazarı (`/pazar`)
- Arz–talep fiyatları (spot al/sat)
- Oyuncu **ilan verme** ve **ilan kabul**
- Modül: `src/lib/openMarket.js` · store: `postMarketOffer`, `acceptMarketOffer`, `cancelMarketOffer`

#### Kara borsa (`/kara-borsa`)
- Anonim ilanlar (takma ad)
- Türler: paralı ajan, yasak silah, çalıntı mal
- Yakalanma riski ve diplomatik kriz haberleri
- Modül: `src/lib/blackMarket.js`

#### Ticaret (`/ticaret`)
- Şehirler arası konvoy / kaynak transferi
- Haritada ticaret rotası görselleştirme

---

## 5. Üs, Binalar ve Kuyruk

### 5.1 Çoklu şehir
- Oyuncunun birden fazla şehri olabilir (ör. İzmir, Çeşme)
- **Aktif şehir** üst bardan seçilir
- **Ana karargâh (MAIN_HQ)** koruma kuralları (`worldCitySystem`)

### 5.2 Bina sistemi
- Binalar **seviye 0**’dan başlar; **Komuta Merkezi (hq)** önce inşa edilmeli
- Ön koşul zinciri: `src/lib/buildingUtils.js` → `BUILDING_PREREQUISITES`
- Maliyet/süre: `src/data/buildingCatalog.js` (Sv.0→1 kritik)
- **1 aktif inşaat**, fazlası **inşaat kuyruğu**
- Görseller: `public/buildings/*.jpg`, `buildingVisualCatalog.js`

### 5.3 Önemli binalar
| Bina | Açılış | İşlev |
|------|--------|--------|
| Komuta Merkezi | Başlangıç | HQ, ilerleme kilidi |
| Maden / Depo | Erken | Kaynak |
| Kara Kuvvetleri (Kışla) | İnşaat sonrası | Kara birlik üretimi |
| Hava Üssü | İnşaat | Hava birlikleri |
| Tersane | Kıyı şehir | Deniz birlikleri |
| Ar-Ge | İnşaat | Teknoloji ağacı |
| Siber Operasyon Merkezi | İnşaat | Siber saldırılar |
| Yapay Zeka Merkezi | İleri | Bonuslar, istihbarat üstünlüğü |

---

## 6. Araştırma ve Teknoloji

- Standart askeri Ar-Ge: saldırı, savunma, üretim, casusluk, hava…
- **KBRN dalı:** Yüksek Ar-Ge sonrası nükleer/kimyasal/biyolojik
- **YZ Merkezi:** İnşaat, üretim, casusluk, siber bonusları; yüksek enerji tüketimi
- Sayfa: `/arastirma`

---

## 7. Ordu ve Üretim

### 7.1 Kollar
| Kol | Sayfa | Birim örnekleri |
|-----|-------|-----------------|
| Kara | `/kisla` (Kara Kuvvetleri) | Piyade, tank, zırhlı, kolonist |
| Hava | `/hava` | Keşif, avcı, bombardıman, İHA |
| Deniz | `/tersane` | Hücumbot, fırkateyn (kıyı şart) |

- Üretim **kuyruk** mantığı (`productionQueue`)
- Kolonist ile **yeni şehir kurma**
- Katalog: `src/data/unitCatalog.js`

---

## 8. Harita ve Dünya Şehir Sistemi

### 8.1 Harita özellikleri (`/harita`)
- **81 il** GeoJSON; il tıklanınca polygon vurgusu
- Şehir pinleri: own / enemy / bot / empty
- **Sis perdesi:** Görüş casusluk ve operasyonlarla açılır
- **Menzil çemberi** (~250 km) aktif şehir etrafında
- **İdeoloji katmanı:** İller ideolojiye göre renk
- Sefer rotaları: saldırı (kırmızı), casus (sarı), dönüş, ticaret
- Taktik HUD: zoom, odaklan, C4ISR panel

### 8.2 Dünya şehir / imparatorluk (yeni)
- `worldCitiesCatalog` + `worldCitySystem.js`
- Şehir rolleri: MAIN_HQ, COLONY
- Fetih, koruma, harita tohum verisi
- DB migration: `supabase/migrations/20260524120000_world_city_system.sql`
- UI: harita markerları, `CityDetailPanel`, renk kodları

---

## 9. Operasyonlar (Seferler)

**Menü adı:** Operasyonlar (`/seferler`)

### 9.1 Temel sefer mantığı
- Süre **mesafeye** bağlı (`expeditionTravel.js`); kara üst sınır ~5 saat
- **Hava** ~3× hızlı
- Savaş: `battleSimulator.js`, raporlar, ganimet (`lootUtils.js`)
- **Meydan savaşı:** hazırlık süresi, son dakika kilidi

### 9.2 Operasyon kargo (yeni)
- Seferlere **hammadde yükü** eklenebilir (taşıma odaklı)
- Modül: `src/lib/cargoLogistics.js`

### 9.3 İttifak operasyonu (yeni)
- Operasyonlar sayfasından **koordineli saldırı** planlama
- Onay, hedef seçimi, birlik katkısı
- Modül: `src/lib/allianceOperation.js`

### 9.4 Store fonksiyonları (özet)
- `startExpedition`, `recallExpedition`
- `declareMeydanBattle`, `contributeMeydanTroops`
- `startTradeExpedition`, `startCargoTransfer`
- `createAllianceOperation`, `approveAllianceOperation`

---

## 10. İstihbarat, Siber ve KBRN

**Sayfa:** `/istihbarat`

- **Casus operasyonları:** mesafe, teknoloji, başarı şansı
- **Siber saldırılar:** `launchCyberAttack`, altyapı sabotajı, üretim düşürme
- **KBRN seferleri:** kimyasal vb. (yüksek Ar-Ge)
- **Watchlist:** Rakip üs izleme (ajan + YZ merkezi şartı)
- **Intel feed:** Canlı haber akışı

---

## 11. Diplomasi ve İletişim

### 11.1 Diplomasi (`/diplomasi`)
- İttifak UI (kısmen kilitli / geliştiriliyor)
- **Diplomatik anlaşmalar (yeni):**
  - Ateşkes (ceasefire)
  - Saldırmazlık (NAP)
  - İhlalde itibar cezası, enforcement
- Modül: `src/lib/diplomaticAgreements.js`
- Store: `proposeDiplomaticAgreement`, `acceptDiplomaticAgreement`, `breakDiplomaticTreaty`

### 11.2 State Mail (`/mesajlar`)
- Resmi başkanlık yazışması (sohbet değil)
- Alanlar: gönderen, konu, güvenlik protokolü, gövde

### 11.3 Savaş göçü (yeni)
- Savaş kaynaklı **yavaş nüfus göçü**
- Haber akışına yansır
- Modül: `src/lib/populationMigration.js`

---

## 12. İdeoloji, Sadakat ve Liderlik

### 12.1 Dört ideoloji
| Blok | Odak |
|------|------|
| Sosyalist | Kaynak paylaşımı, yardım |
| Kapitalist | Bütçe, ticaret |
| Teknokrat | Ar-Ge hızı |
| Milliyetçi | Sefer zaferi |

- İlk hafta ücretsiz değişim; sonra maliyet + mutluluk şoku
- `setPlayerIdeology`, `awardLoyalty`

### 12.2 Liderlik Tablosu (`/siralama`)
- **Menü adı:** Liderlik Tablosu (eski: Sıralama)
- İdeoloji sadakat puanına göre sıralama
- Canlı Supabase veya demo liste

---

## 13. Mutluluk, Kriz ve İç Güvenlik

- Mutluluk: vergi, kuşatma, siber, KBRN, krizler
- Düşük mutluluk → üretim düşüşü
- **Barış Gücü:** Yeni oyuncu ~7 gün saldırı koruması
- **Kriz motoru:** deprem, ekonomi, enerji, göç (`crisisEngine.js`)
- **Kurucu kriz paneli:** `/kurucu-kriz` (admin)

---

## 14. Sezon, Görevler ve Meta

**Sayfa:** `/sezon-gorevler`

- Günlük görevler (ideolojiye göre 3/gün)
- Sezon şampiyonası: kozmetik + sadakat (ham kaynak ödülü yok — anti-snowball)
- **Devlet Tarih Kitabı:** otomatik kronik (`historyBook.js`)
- **VIP / Prestige:** `performVipAscension`, kalıcı bonus
- **Sunucu temizliği:** 14+ gün inaktif → hayalet şehir → boş arazi (`serverCleansing.js`)
- **MIL-AI Rehber:** Adım adım görevler (`milAiTutorial.js`, `aiProgression.js`)

---

## 15. Arayüz Modülleri (Güncel Menü)

| Menü (TR) | Rota | İşlev |
|-----------|------|--------|
| Ana Merkez | `/` | Komuta özeti, MIL-AI, matris, operasyon widget’ları |
| Binalar | `/binalar` | İnşaat, kuyruk, ön koşullar |
| Araştırma | `/arastirma` | Ar-Ge + KBRN |
| Kara Kuvvetleri | `/kisla` | Kara üretim |
| Hava Üssü | `/hava` | Hava üretim |
| Tersane | `/tersane` | Deniz (kıyı) |
| Operasyonlar | `/seferler` | Aktif/geçmiş operasyonlar, ittifak ops |
| İstihbarat | `/istihbarat` | Casus, siber, KBRN, watchlist |
| Pazar | `/pazar` | Spot + açık ilan pazarı |
| Kara Borsa | `/kara-borsa` | Anonim ilanlar |
| Ticaret | `/ticaret` | Konvoy transfer |
| Diplomasi | `/diplomasi` | Anlaşmalar, ittifak |
| Raporlar | `/raporlar` | Savaş/keşif arşivi |
| Harita | `/harita` | Taktik harita |
| Sezon & Görevler | `/sezon-gorevler` | Görevler, kronik |
| Liderlik Tablosu | `/siralama` | Sadakat sıralaması |
| Admin Log | `/admin-log` | Şeffaf müdahale kayıtları |
| Profil | `/profil` | Rütbe, VIP, rozet |
| State Mail | `/mesajlar` | Resmi yazışma |

**Dil:** Üst çubukta TR / EN bayrakları (`LanguageContext`, `src/i18n/locales/`).

---

## 16. Ana Merkez Widget’ları

Ana sayfada (`/`) komuta özeti kutuları:
- **AKTİF OPERASYON** — giden sefer sayısı
- **İNŞAAT KUYRUĞU** — bina kuyruğu
- **ÜRETİM KUYRUĞU** — birim kuyruğu
- **OKUNMAYAN RAPOR** — rapor sayısı
- **ŞEHİR SAYISI** — koloni sayısı

**MIL-AI REHBER:** Typewriter terminal; sıradaki hedefler (`MilAiAdvisor.jsx`)  
**Stratejik Yönetim Matrisi:** Nüfus, moral, saatlik üretim, operasyon çipleri

---

## 17. gameStore — Oyuncu Aksiyonları (Referans)

Merkez dosya: `src/stores/gameStore.js`

### 17.1 Ekonomi ve pazar
- `executeMarketTrade` — spot al/sat
- `postMarketOffer`, `acceptMarketOffer`, `cancelMarketOffer`
- `postBlackMarketListing`, `buyBlackMarketListing`
- `startTradeExpedition`, `startCargoTransfer`
- `setCityTaxRate`

### 17.2 İnşaat ve üretim
- `enqueueConstruction`, `speedUpConstruction`, `startQueuedConstruction`
- `enqueueProduction`, `speedUpProduction`

### 17.3 Operasyonlar ve savaş
- `startExpedition` (cargoHammadde parametresi ile)
- `recallExpedition`
- `declareMeydanBattle`, `contributeMeydanTroops`, `recallMeydanContribution`
- `sendIntelOperation`
- `createAllianceOperation`, `approveAllianceOperation`

### 17.4 Siber / KBRN
- `launchCyberAttack`, `startCyberVirusExpedition`, `startKbrnChemExpedition`
- `getCyberCapabilities`

### 17.5 Diplomasi ve meta
- `proposeDiplomaticAgreement`, `acceptDiplomaticAgreement`, `rejectDiplomaticAgreement`, `breakDiplomaticTreaty`
- `setPlayerIdeology`, `awardLoyalty`
- `claimDailyQuestReward`, `claimSeasonPrize`
- `recordChronicle`, `loadHistoryBookArchive`
- `performVipAscension`
- `completeMilAiQuest`

### 17.6 Admin / kurucu
- `adminTriggerCrisis`, `adminSetCentralBank`, `adminSetRegionalIncentive`
- `recordAdminOverride`

### 17.7 Sistem
- `tick` — kaynak üretimi, kuyruk, sefer tamamlama, göç, pazar
- `hydrateFromSupabase`, `initWorldSystems`
- `setActiveCity`, `touchPlayerActivity`

---

## 18. Teknik Mimari

### 18.1 Yığın
| Katman | Teknoloji |
|--------|-----------|
| UI | React 19, React Router 7 |
| Build | Vite 8, PWA (workbox) |
| Harita | Leaflet, react-leaflet |
| State | Zustand (`gameStore.js`) |
| Stil | Vanilla CSS (Tailwind yok) |
| Auth | Supabase (kısmi) |
| Deploy | Vercel + GitHub Actions |

### 18.2 Dizin yapısı
```
src/
  App.jsx                 → Rotalar
  pages/                  → Sayfa kabukları
  components/             → UI (ResourceBar, Layout, MilAiAdvisor…)
  stores/gameStore.js     → Ana oyun motoru
  data/                   → placeholder, gameInit, buildingCatalog
  lib/                    → Saf oyun mantığı (50+ modül)
  map/                    → Türkiye haritası, pinler, rotalar
  i18n/locales/tr.js,en.js
supabase/migrations/      → DB şemaları
docs/                     → Bu belge ve PDF çıktıları
```

### 18.3 Veri akışı
1. `gameInit.js` → başlangıç state
2. `startTicker` → `tick()` periyodik
3. Sayfalar store’dan okur, aksiyon çağırır
4. Supabase: auth, leaderboard, kısmi persist (`supabaseSync.js`)

---

## 19. Son Revizyonlar (Kronoloji)

1. Global **gameStore** — canlı sefer, rapor, kuyruk
2. **Siber harita** — sis, rotalar, şehir paneli
3. **Ekonomi** — üretim dondurma, mesafe seferi
4. **VIP + sunucu temizliği**
5. **PWA + deploy pipeline** düzeltmeleri
6. **Harita HUD** — aktif şehir pini, menzil, odaklan
7. **buildingCatalog** — Sv.0 binalar için maliyet
8. **Bina görselleri** — 6 askeri-endüstriyel JPG
9. **İmparatorluk hazinesi** — ortak bütçe
10. **Açık hammadde pazarı** — ilan, kabul, arz-talep
11. **Operasyon kargo** — hammadde taşıma
12. **Diplomatik anlaşmalar** — ateşkes, NAP, itibar
13. **Kara borsa** — anonim ilanlar, kriz
14. **Savaş göçü** — nüfus migrasyonu, haber
15. **İttifak operasyonu** — koordineli saldırı
16. **Dünya şehir sistemi** — HQ, fetih, harita
17. **TR/EN dil seçici** — üst çubuk bayrakları
18. **Menü yeniden adlandırma** — Operasyonlar, Kara Kuvvetleri, Liderlik Tablosu
19. **Tipografi düzeltmesi** — Major Mono kaldırıldı; okunaklı Rajdhani/Titillium
20. **Deploy güvenilirliği** — geçersiz token’da workflow kırmızı; canlı doğrulama

---

## 20. Gelecekte Eklenmesi Muhtemel Özellikler (Roadmap)

### 20.1 Kısa vade (0–3 ay)
- Geçerli `VERCEL_TOKEN` + otomatik her-push deploy
- Supabase tam oyun kaydı (şehir, kuyruk, sefer persist)
- Diplomasi backend: ittifak kurma, savaş ilanı
- Ekonomi ve savaş **denge tablosu** (spreadsheet + sim)
- i18n derinleştirme (tüm sayfa gövdeleri, toast, MIL-AI)

### 20.2 Orta vade (3–9 ay)
- **Sunucu otoriteli tick** (Node/Edge worker veya Supabase Edge Functions)
- WebSocket: canlı saldırı uyarısı, diplomasi, pazar
- **Gerçek multiplayer** — aynı haritada çok oyuncu
- İttifak savaşları ve bölgesel sezon hedefleri
- Mobil UX iyileştirmesi (harita + panel geçişleri)

### 20.3 Uzun vade (9+ ay)
- **Küresel harita** (Türkiye dışı bölgeler)
- Sezon reset + kalıcı meta (Prestige 2.0)
- Modlü sunucular (hardcore, barış, roleplay)
- API / bot entegrasyonu (resmi olmayan araçlar için)
- Anti-hile ve replay sistemi

---

## 21. Bilinen Sınırlamalar

| Alan | Durum |
|------|--------|
| UI / tek oyunculu simülasyon | Güçlü prototip |
| Tam multiplayer / sunucu otoritesi | Planlı, eksik |
| Ekonomi & savaş dengesi | Test aşaması |
| GitHub → Vercel otomatik deploy | VERCEL_TOKEN gerekli |
| İttifak menüsü | Kısmen kilitli |
| Placeholder oyun adı | `[OYUN ADI]` değiştirilebilir |

---

## 22. Yapay Zeka İçin Hızlı Test Senaryosu

1. https://stratejioyunu.vercel.app → Giriş / Hızlı Giriş
2. Ana Merkez → widget’lar ve MIL-AI
3. `/binalar` → HQ inşa (kaynak yeterliyse)
4. `/harita` → pin, menzil, odaklan
5. `/kisla` → kilit / üretim (bina sonrası)
6. `/seferler` → yeni operasyon, kargo
7. `/pazar` → spot + ilan
8. `/kara-borsa` → anonim ilan
9. `/diplomasi` → anlaşma teklifi
10. `/siralama` → liderlik tablosu
11. Dil: TR ↔ EN üst çubuk

---

## 23. Önemli Dosya Referansları

| Konu | Dosya |
|------|--------|
| Ana state | `src/stores/gameStore.js` |
| Başlangıç | `src/data/gameInit.js` |
| Bina maliyet | `src/data/buildingCatalog.js` |
| Açık pazar | `src/lib/openMarket.js` |
| Kara borsa | `src/lib/blackMarket.js` |
| Diplomasi | `src/lib/diplomaticAgreements.js` |
| İttifak op | `src/lib/allianceOperation.js` |
| Dünya şehir | `src/lib/worldCitySystem.js` |
| Göç | `src/lib/populationMigration.js` |
| Harita | `src/map/TurkeyMap.jsx` |
| i18n TR | `src/i18n/locales/tr.js` |
| Deploy | `docs/DEPLOY.md`, `.github/workflows/deploy.yml` |
| AI özet (kısa) | `PROJE_OZETI_AI.md` |

---

## 24. İletişim

- **Geliştirici:** İda (Cursor + AI ile iteratif geliştirme)
- **Repo:** https://github.com/winegg420/stratejioyunu
- **Canlı:** https://stratejioyunu.vercel.app

*Bu belge Mayıs 2026 itibarıyla kod tabanından türetilmiştir. Mekanikler güncellemelerle değişebilir.*

**© 2026 Stratejioyunu Geliştirme Projesi**
