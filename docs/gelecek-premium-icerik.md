# Gelecek Premium İçerik — Ürün Notları

> **Durum:** Planlama / ileride eklenecek. Kod veya canlı özellik yok.  
> **Kayıt tarihi:** 2026-05-19  
> **İlgili UI:** `CommandTickerFeed` (küresel haber şeridi), sezon sistemi, Lockdown (savunma), ideoloji/ittifak.

---

## 1. İttifak Yayın Kredisi (Küresel Propaganda)

**Konsept:** İttifaklar, `CommandTickerFeed` küresel haber şeridinde kendi propagandasını yayınlamak, tüm haritaya savaş ilanı etmek veya diğer ideolojileri tehdit etmek için **Yayın Kredisi** harcar.

**Ekonomi:**
- Güçlü ittifak liderleri psikolojik üstünlük ve “tüm sunucuya güç gösterme” için ciddi para yatırır.
- **Gelir modeli:** Yalnızca metin yayınlama — doğrudan savaş gücü satılmaz → **premium içerik**, P2W riski düşük.

**Teknik ipuçları (ileride):**
- Sunucu geneli duyuru kuyruğu + moderasyon/onay (opsiyonel).
- Kredi paketleri (mağaza / ittifak hazinesi).
- Şeritte özel stil: ittifak adı, ideoloji rengi, süre sınırlı banner.

---

## 2. Sezonluk Operasyon Pasaportu (Battle Pass) — Ana Nakit Akışı

**Konsept:** Oyuncu “güç” alamıyorsa **itibar ve statü** alır. Her **2–3 ay** yeni küresel sezon (ör. *Ege Operasyonu*, *Siber Soğuk Savaş*).

**Satın alma:** Pasaport **nakit** (gerçek para).

**İlerleme:** Sezon boyunca aktif kalma, siber saldırı, şehir yönetimi → pasaport seviyesi.

**Ödüller (kozmetik / statü — gameplay gücü yok):**
- Dev binalara özel **Neon Kaplamalar**
- Profil **Özel Rütbe Nişanları**
- Sohbet panelinde **farklı renkte parlayan İdeoloji Etiketleri**

**Hedef kitle:** Hardcore oyuncular — kitle içinde “lider” görünmek için ödeme motivasyonu yüksek.

**Teknik ipuçları (ileride):**
- `seasonStats` / sezon motoru ile entegrasyon.
- XP görevleri: siber op, inşaat, sefer (güç vermeden).
- Ödül tablosu: kozmetik ID’ler, unlock tarihleri.

---

## 3. Kozmik Oda — Veri ve Analiz Aboneliği (SaaS)

**Konumlandırma:** Oyun = siber-istihbarat yazılımı; **aylık abonelik**.

| Katman | Erişim |
|--------|--------|
| **Standart** | Haritada şehirler + temel durum |
| **Kozmik Oda (aylık X TL)** | Stratejik analitik paneller |

**Abone verileri (örnek):**
- Kim hangi ideolojiyle kiminle ittifak kurmuş
- Hangi şehrin mutluluk oranı düşüyor
- Borsada hangi kaynak manipüle ediliyor
- Grafikler ve trend panelleri

**Önemli:** Abone **doğrudan güç** kazanmaz; veriyle **nerede siber saldırı** yapacağını bilir → strateji severler abonelik öder.

**Teknik ipuçları (ileride):**
- Supabase agregasyon / read-only API.
- `profiles` + `alliances` + `market` + `happiness` zaman serisi.
- Paywall: route veya panel bazlı (`/kozmik-oda`).

---

## 4. Çevrimdışı Güvenlik Sigortası (Lockdown Insurance)

**Problem:** Oyuncu 7/24 online olamaz. AI kaynaklı afet, gece siber saldırı → en büyük korku.

**Ürün:** Haftalık veya aylık **Siber Güvenlik Poliçeleri**.

**Davranış (poliçe aktif + oyuncu offline):**
- Üsse afet veya siber saldırı gelirse → mevcut **Lockdown (Savunma)** otomatik tetiklenir.
- Kaynakların **%80’i** siber kasaya kilitlenir (mevcut lockdown mekaniği ile uyumlu).

**Değer önerisi:** Uyurken içinin rahat etmesi → **koruma parası**.

**Teknik ipuçları (ileride):**
- `protectionEndsAt` / `cyberEffects` benzeri `insurancePolicyEndsAt`.
- Offline tespiti: son aktivite timestamp.
- Otomatik lockdown hook: `supabaseSync` poll veya sunucu tarafı edge function.

---

## Öncelik / Gelir Hiyerarşisi (ürün görüşü)

1. **Operasyon Pasaportu** — en büyük nakit akışı  
2. **Kozmik Oda aboneliği** — tekrarlayan SaaS geliri  
3. **Yayın Kredisi** — ittifak lideri harcaması, düşük geliştirme  
4. **Lockdown Sigortası** — retention + düzenli küçük ödeme  

**Native reklam & ödüllü video** (AdSense/Adinplay, ticker 1/5, sponsor panel, brifing videosu): ayrı not → `docs/gelecek-reklam-native-ads.md`

---

## İlgili Kod Referansları (mevcut)

| Alan | Dosya |
|------|--------|
| Küresel şerit | `src/components/CommandTickerFeed.jsx` |
| Dinamik bant mesajları | `src/lib/mapStatusTicker.js` |
| Sezon | `src/lib/seasonChampionship.js`, `src/pages/SeasonQuests.jsx` |
| Lockdown / savunma | araştırma / siber / `counterIntel` (kod tabanında aranacak) |
| İdeoloji / ittifak | `src/lib/ideologySystem.js`, diplomasi modülleri |

---

*Bu dosya yalnızca planlama notudur; implementasyon talep edilmeden kod eklenmemelidir.*
