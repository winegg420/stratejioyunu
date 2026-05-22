# Gelecek Reklam Monetizasyonu — Native Ads & Ödüllü Video

> **Durum:** Planlama / ileride eklenecek. Kod veya canlı özellik yok.  
> **Kayıt tarihi:** 2026-05-19  
> **Prensip:** Sağ/sol sırıtan Google kutuları **yok** — reklamlar arayüzün kendi HUD elementlerine **native** gömülür.

---

## 1. Oyun İçi Sponsorlu Afiş ve Ticker (SaaS / Native Ads)

### Neden native?

- Klasik web sitesi gibi kenarlarda AdSense banner kutuları oyun hissini bozar ve mobilde yer kaplar.
- Bunun yerine **AdSense**, **Adinplay** veya benzeri ağlar, mevcut terminal/HUD bileşenlerine slot olarak bağlanır → oyuncu “reklam” değil “komuta arayüzü parçası” görür.

### Ağ entegrasyonu (ileride)

| Sağlayıcı | Kullanım |
|-----------|----------|
| **Google AdSense** | Metin (text) reklamlar, uyumlu içerik reklamları |
| **Adinplay** | Oyun odaklı video / display (özellikle ödüllü video) |

- CSP / script yükleme: yalnızca onaylı origin.
- Çocuk verisi / GDPR / çerez onayı (TR + AB) ayrı akış.
- Geliştirme modunda reklam slotları **placeholder** (ör. `[ SPONSOR — TEST ]`).

---

## 2. CommandTickerFeed — Metin Reklam Slotu

**Mevcut bileşen:** `src/components/CommandTickerFeed.jsx`  
**Konum:** `TerminalBottomDock` alt şerit (`src/components/TerminalBottomDock.jsx`).

**Kural:** Her **5 askeri/operasyonel haberden 1’i** harici metin reklam slotu.

```
Haber → Haber → Haber → Haber → Haber → [SPONSOR metin] → ...
```

**Görünüm:**
- Etiket: `[ SPONSOR ]` veya `[ SİBER GÜVENLİK SPONSOR ]` — askeri haber gibi **gizlenmez** (yanıltıcı UX yasak).
- Stil: mevcut `command-ticker__tag` ailesi; hafif altın/gri ton (premium içerikten farklı).
- İçerik: AdSense **In-feed / text** unit veya Adinplay native line item.

**Teknik taslak (ileride):**
- `buildTickerItems()` sonrası `injectNativeAdSlots(items, { every: 5 })`.
- `item.kind: 'organic' | 'native-ad'`.
- Reklam yüklenemezse slot atlanır veya kısa “Komuta hattı senkron” fallback.

**Çakışma notu:** İttifak **Yayın Kredisi** (ücretli propaganda) ile sponsor slotları ayrı kuyruk — önce ücretli yayın, sonra AdSense doldurucu. Bkz. `docs/gelecek-premium-icerik.md` §1.

---

## 3. Siber Güvenlik Sponsor Paneli (Banner)

**Konum:** Terminal ekranının **sağ alt veya sağ üst** boş köşesi (Mil-AI / radar paneli yanı).

**UI adı:** `[ SİBER GÜVENLİK SPONSOR PANELİ ]`

- Sabit küçük banner (ör. 300×50 veya responsive strip).
- Tema: koyu arka plan + neon cyan border — `dashboard-command` / `c4isr-ui` ile uyumlu çerçeve.
- İçerik: AdSense display veya Adinplay banner unit.

**Dosya adayları (ileride):**
- Yeni: `src/components/SponsorSecurityPanel.jsx`
- Stil: `src/styles/c4isr-ui.css` veya `sponsor-slots.css`

---

## 4. Ödüllü Video (Rewarded Ads)

Oyuncu **güç satın almadan** küçük, süreli bonus alır; gelir video izlemeden.

### Tetikleyici A — Ar-Ge / araştırma

**Akış:** Araştırma veya Ar-Ge kuyruğu başlatılırken opsiyonel teklif:

> **30 saniyelik Operasyon Brifingi İzle (Reklam)**  
> → Araştırma hızı **%10** artış (süre sınırlı: tek aktif araştırma veya X saat).

**Denge:** %10 düşük — P2W algısını düşük tutar; pasaport/kozmetik satışıyla çelişmez.

### Tetikleyici B — Siber saldırı / istihbarat

**Akış:** Siber saldırı veya istihbarat ekranından:

> **Siber İstihbarat Videosu İzle (Reklam)**  
> → **Günlük 1× ücretsiz uydu tarama** hakkı (harita tarama / intel scan).

**Denge:** Günlük cap (1–3); VIP veya Kozmik Oda aboneliği ile stack kuralları net tanımlanmalı.

### Teknik taslak (ileride)

| Parça | Not |
|-------|-----|
| `src/lib/rewardedAds.js` | SDK callback, cooldown, günlük limit |
| `player_meta.rewardedAds` | Son izleme, günlük sayaç, aktif buff bitişi |
| UI | Modal: `RewardedBriefingModal.jsx` — 30 sn countdown + iptal |
| Buff | `researchSpeedMult: 1.1` veya `freeSatelliteScan: true` (süreli) |

**Sağlayıcı:** Adinplay rewarded video veya Google AdMob (web wrapper) — platform kararı sonra.

---

## 5. UX ve Etik Kurallar

1. **Şeffaflık:** Sponsor içerik her zaman `[ SPONSOR ]` ile işaretli.
2. **Frekans sınırı:** Ticker’da en fazla her 5 haberde 1 reklam; üst üste 2 sponsor yok.
3. **Ödüllü video gönüllü:** Otomatik oynatma yok; net ödül metni.
4. **Premium çakışma:** Operasyon Pasaportu sahiplerine reklamsız şerit opsiyonu (ileride SKU).
5. **Çevrimdışı / mobil:** Video reklam yalnızca desteklenen ortamda gösterilir.

---

## 6. Gelir Modeli Özeti

| Kanal | Tip | Tahmini efor |
|-------|-----|----------------|
| Ticker metin (1/5) | Native display / CPM | Orta |
| Sponsor panel | Banner CPM | Düşük |
| Ödüllü video | CPV / yüksek eCPM | Yüksek (SDK + test) |

**Operasyon Pasaportu** ve **Kozmik Oda** ile birlikte: pasaport = itibar parası, reklam = kitle monetizasyonu, abonelik = power-user veri.

---

## İlgili Kod (mevcut)

| Alan | Dosya |
|------|--------|
| Canlı haber şeridi | `src/components/CommandTickerFeed.jsx` |
| Alt terminal dock | `src/components/TerminalBottomDock.jsx` |
| Ticker stilleri | `src/styles/c4isr-ui.css`, `operational-flow.css` |
| Dinamik haber üretimi | `src/lib/mapStatusTicker.js` |
| Harita alt bant (ayrı) | `src/map/MapStatusBand.jsx` — reklam **buraya değil**, global dock şeridine |

---

## Çapraz referans

- Ücretli ittifak propaganda: `docs/gelecek-premium-icerik.md` §1 (Yayın Kredisi)
- Agent kuralı: `.cursor/rules/master-vision.mdc` → Premium & Reklam planlama

---

*Implementasyon talep edilmeden kod eklenmemelidir.*
