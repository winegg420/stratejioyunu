# STRATEJİ OYUNU
## Küresel Başkanlık (2044) — Proje Tanıtım Belgesi

**Sürüm:** Geliştirme önizlemesi · Türkiye-1 Sezon  
**Platform:** Web (PWA) · https://stratejioyunu.vercel.app  
**Tür:** Tarayıcı tabanlı jeopolitik strateji / 4X-lite MMO prototipi

---

## 1. Özet

Stratejioyunu, klasik tarayıcı strateji oyunlarının (OGame, Travian vb.) kaynak–bina–ordu–harita döngüsünü **jeopolitik liderlik simülasyonu** ile birleştiren bir projedir. Oyuncu bir “komutan” değil, **tek yetkili Devlet Başkanı (President)** rolündedir: seçim yok, meclis yok; kararlar doğrudan komuta merkezinden verilir.

Oyun, **Türkiye coğrafyası** üzerinde gerçek il sınırlarıyla modellenmiş taktik harita sunar; ekonomi, inşaat, araştırma, kara/hava/deniz kuvvetleri, seferler, istihbarat, siber operasyonlar ve diplomasi modülleri tek bir **siber-askeri komuta terminali** arayüzünde toplanır.

> **Not:** Proje aktif geliştirme aşamasındadır. Çok oyunculu sunucu otoritesi ve tam ekonomik denge henüz üretim seviyesinde değildir; temel sistemler istemci tabanlı simülasyon ve bulut senkronizasyonu ile çalışır.

---

## 2. Ana Amaç

| Boyut | Açıklama |
|--------|----------|
| **Stratejik** | Sınırlı kaynaklarla üs kurmak, ordulaşmak, haritada rakiplere ve boş arazilere karşı üstünlük sağlamak. |
| **Jeopolitik** | Dört ideolojik bloktan birine bağlanarak üretim, ticaret, Ar-Ge veya fetih yolunu optimize etmek; sadakat puanı ile itibar kazanmak. |
| **Operasyonel** | Bina kuyruğu, araştırma, birim üretimi ve mesafeye bağlı seferleri zamanında yönetmek. |
| **Diplomatik** | Resmi kanallar (State Mail), ileride ittifak ve pakt sistemleri; saldırmazlık ve ticaret odaklı uzun vadeli ilişkiler. |
| **Meta / Sezon** | Sezon görevleri, şampiyonluk tabloları, Devlet Tarih Kitabı ile kalıcı hikâye arşivi oluşturmak. |

**Uzun vadeli vizyon:** Tekil seferlerden bölgesel blok savaşlarına ve küresel pakt çatışmalarına ölçeklenebilir; coğrafya (`regionId`, il/ülke sınırları) kuralların merkezinde kalır.

---

## 3. Temel Oyun Mekanikleri

### 3.1 Kaynaklar ve ekonomi

Altı ana kaynak türü yönetilir: **Nüfus (gıda/iş gücü), Petrol, Metal, Enerji, Bütçe, Uranyum** (ileri teknolojiler için). Üretim bina seviyelerine, ideoloji çarpanlarına, mutluluk çarpanına ve aktif krizlere bağlıdır.

- **Depo kapasitesi:** Dolu depoda ilgili üretim durur.  
- **Nüfus baskısı:** Yetersiz nüfusta maden/endüstri üretimi düşer.  
- **Vergi (Maliye):** Gelir artışı mutluluğu düşürür; aşırı vergi ekonomik kriz tetikleyebilir.  
- **Konvoy ticareti:** Şehirler arası kaynak transferi; haritada görsel ticaret rotaları.

### 3.2 Üs, bina ve kuyruk

- Çoklu şehir (ör. İzmir, Çeşme); **aktif şehir** üzerinden yönetim.  
- Binalar seviye 0’dan inşa edilir; **Komuta Merkezi (HQ)** ve ön koşul zinciri zorunludur.  
- Aynı anda **bir aktif inşaat**, fazlası **inşaat kuyruğuna** alınır.  
- Kışla, Hava Üssü, Tersane (kıyı), Ar-Ge, Siber Operasyon Merkezi, Yapay Zeka Merkezi vb. kademeli açılır.

### 3.3 Araştırma ve teknoloji

- Standart askeri Ar-Ge (saldırı, üretim, casusluk, hava savunma…).  
- **KBRN dalı:** Yüksek Ar-Ge seviyesi sonrası açılan nükleer/kimyasal/biyolojik savunma ve taktik araştırmalar.  
- **Yapay Zeka Merkezi:** İnşaat, üretim, casusluk ve siber operasyonlara kademeli bonus; yüksek enerji tüketimi.

### 3.4 Ordu ve üretim

| Kol | Birim örnekleri | Not |
|-----|-----------------|-----|
| Kara | Piyade, tank, zırhlı, hava savunma, özel tim, kolonist | Kışla |
| Hava | Keşif, avcı, bombardıman, İHA | Hava üssü |
| Deniz | Hücumbot, fırkateyn, denizaltı | Tersane (kıyı şehir) |

Birim üretimi kuyruk mantığıyla işler. Kolonist ile **yeni şehir kurma** mümkündür.

### 3.5 Harita ve coğrafya

- **81 il** GeoJSON sınırları; tıklanınca il polygon vurgusu.  
- Şehir pinleri: kendi / düşman / boş / bot; zoom seviyesinde **şehir adı ve sahip etiketi**.  
- **Sis perdesi:** Görüş yalnızca kendi üsler, casusluk ve aktif operasyonlarla açılır.  
- **İdeoloji harita katmanı:** İller ideolojiye göre renklendirilir; aynı ideoloji “doğal müttefik” vurgusu.  
- **Hedef nişangahları** ve sefer rotaları (saldırı, casus, dönüş, ticaret).  
- Harita pan alanı genişletilmiştir (Ege–İran tamponu); Türkiye dışı maske.

### 3.6 Seferler ve savaş

- Sefer süresi **mesafeye** bağlıdır (kara için üst sınır ~5 saat).  
- **Saf hava** seferleri yaklaşık **3× hızlı**.  
- Savaş sonucu simülatörle üretilir; **raporlar** arşivlenir.  
- **Meydan savaşı** modu: hazırlık süresi ve son dakika kilidi kuralları.  
- Ganimet, kuşatma etkisi (mutluluk), gelen saldırı uyarıları.

### 3.7 İstihbarat ve siber

- **Casus operasyonları:** Mesafe ve teknoloji ile başarı şansı.  
- **Siber Operasyon Merkezi:** Altyapı sabotajı, üretim düşürme, muhabere baskısı (seviyeye göre yetenekler).  
- **İstihbarat ağı (watchlist):** Rakip üsse casus + YZ merkezi üstünlüğü şart; 2 ajan rezervasyonu.  
- Siber/KBRN etkileri mutluluk ve üretime doğrudan yansır.

### 3.8 Mutluluk ve iç yönetim

Mutluluk; vergi, kuşatma, siber saldırı, KBRN ve krizlerden etkilenir. Düşük mutluluk **üretim hızını ve verimini** düşürür. Yeni hesaplarda **Barış Gücü** (yaklaşık 7 gün) saldırı koruması sağlar.

### 3.9 İdeoloji ve sadakat

Dört blok: **Sosyalist, Kapitalist, Teknokrat, Milliyetçi** — hiçbiri oyunu kilitlemez; üretim/ticaret/Ar-Ge/savaş çarpanları uygular.

- İlk hafta ücretsiz ideoloji değişimi; sonrasında yüksek bütçe maliyeti ve mutluluk şoku.  
- **Sadakat puanı:** Doktrine uygun eylemlerle artar; `/siralama` ideoloji liderlik tablosu.  
- Haritada siyasi ideoloji görünümü.

### 3.10 Diplomasi ve iletişim

- **State Mail:** Oyuncular arası sohbet değil; şifreli, resmi başkanlık yazışması (gönderen, konu, güvenlik protokolü alanları).  
- Diplomasi paneli: ittifak, anlaşma, savaş ilanı (geliştirme devam ediyor).  
- **Devlet Tarih Kitabı:** Savaş, rejim değişimi, antlaşma ihlali gibi olaylar otomatik kronik kaydı.

### 3.11 Sezon, görevler ve meta

- **Dinamik günlük görevler** (ideolojiye göre 3 görev/gün).  
- **Haftalık/aylık sezon şampiyonaları:** Kozmetik unvan + sadakat; ham kaynak/ordu ödülü yok (kaydırma dengesi).  
- **VIP / Prestige** ve sunucu temizliği: Uzun süre inaktif hesapların şehirleri “hayalet” statüye geçer, haritada boşalır.

### 3.12 Şeffaflık ve kurucu araçları

- **Admin müdahale kaydı:** Merkez bankası pariteleri, bölgesel teşvik — herkes okuyabilir.  
- **Kriz motoru:** Deprem, ekonomik, enerji, göç; kurucu panelden tetiklenebilir.  
- **Kurucu Komuta Merkezi:** Sunucu ekonomisi ve kriz müdahalesi.

---

## 4. Fonksiyon Modülleri (Arayüz)

| Modül | Rota | İşlev |
|-------|------|--------|
| Ana Merkez | `/` | Kaynak özeti, brifing, mini harita, kriz/ideoloji durumu |
| Binalar | `/binalar` | İnşaat, yükseltme, kuyruk, ön koşul tooltip |
| Araştırma | `/arastirma` | Ar-Ge ve KBRN ağacı |
| Kışla / Hava / Tersane | `/kisla` … | Birim üretim kuyrukları |
| Seferler | `/seferler` | Giden/gelen seferler, meydan savaşı |
| Harita | `/harita` | Taktik harita, şehir paneli, hedef seçimi |
| İstihbarat | `/istihbarat` | Casus, siber, KBRN, watchlist |
| Ticaret | `/ticaret` | Konvoy ve kaynak transferi |
| Diplomasi | `/diplomasi` | İttifak ve anlaşmalar (genişletiliyor) |
| Raporlar | `/raporlar` | Savaş ve keşif arşivi |
| State Mail | `/mesajlar` | Resmi yazışma |
| Sezon & Görevler | `/sezon-gorevler` | Görevler, şampiyona, tarih kitabı |
| Sıralama | `/siralama` | İdeoloji sadakat tablosu |
| Profil | `/profil` | Rütbe, rozet, VIP, sezon geçmişi |
| Admin Log | `/admin-log` | Şeffaf müdahale kayıtları |

---

## 5. Teknik Özellikler (Kısa)

- **React 19 + Vite 8**, Zustand merkezli oyun state’i.  
- **Leaflet** harita; lazy ilçe yükleme.  
- **Supabase** kimlik doğrulama ve kısmi bulut kayıt (geliştiriliyor).  
- **PWA:** Mobil kurulum, offline önbellek.  
- **Vercel** üzerinde sürekli deploy.

---

## 6. Projeyi Ayıran Özellikler (Objektif)

Aşağıdaki maddeler, yaygın tarayıcı strateji oyunlarıyla **kıyaslandığında** bu projede öne çıkan veya mimaride ayrık tasarlanmış unsurlardır. “Tam bitmiş üretim” ile “tasarım hedefi” ayrımı geliştirme notlarında belirtilmiştir.

1. **President / Küresel Başkanlık çerçevesi** — Oyuncu kimliği komutan değil, seçimsiz tek otorite; arayüz dili resmi brifing ve komuta terminali (sıradan MMO sohbet tonu yok).

2. **State Mail** — Genel sohbet yerine şifreli, meta alanlı resmi diplomatik yazışma protokolü.

3. **Dört ideoloji × oynanabilir çarpan** — Sadece kozmetik fraksiyon değil; üretim, ticaret, Ar-Ge hızı ve sefer temposuna sayısal etki + sadakat liderlik tablosu.

4. **İdeoloji harita katmanı** — İl bazında siyasi renklendirme ve aynı ideolojide “doğal müttefik” okuması.

5. **Gerçek Türkiye il polygon’ları** — Soyut kare/ızgara bölge yerine GeoJSON il sınırlarıyla bölge hissi ve tıklama vurgusu.

6. **Entegre siber + YZ + KBRN üçgeni** — Ayrı mini-oyunlar değil; mutluluk, üretim, kışla hızı ve istihbarat üstünlüğüne bağlı tek ekonomi.

7. **İstihbarat watchlist** — Pasif harita okuması yerine aktif ajan ve YZ merkezi üstünlüğü şartıyla rakip üs izleme.

8. **Devlet Tarih Kitabı** — Otomatik kronik (savaş, rejim değişimi, ihlal) — sezon hikâyesini arşivleyen meta katman.

9. **Sezon şampiyonası ödül felsefesi** — Şampiyonluk ödüllerinde kasıtlı olarak ham kaynak/ordu yok; kozmetik + sadakat (anti-snowball).

10. **İdeolojiye göre günlük görev üretimi** — Statik görev listesi yerine rejime uygun dinamik görev seti.

11. **Şeffaf admin / kurucu müdahale günlüğü** — Merkez bankası ve bölgesel teşvik müdahaleleri oyunculara açık log.

12. **Sunucu temizliği (ghost şehir)** — Uzun inaktiflikte şehirlerin haritada boşalması; yaşayan harita metaı.

13. **Mesafe–süre sefer modeli + hava hız çarpanı** — Sabit tur süresi yerine harita mesafesi ve birlik kompozisyonuna bağlı ETA.

14. **Mutluluk × vergi × kuşatma × siber/KBRN** — Tek “morale” barı yerine çok kaynaklı iç güvenlik simülasyonu.

15. **Siber-askeri HUD UX paradigması** — Fantazi/medieval skin yerine 2044 terminal estetiği (typewriter brifing, HUD kesik köşeli paneller).

16. **Barış Gücü + kademeli HQ kilidi** — Erken oyunda agresyon baskısı ve içerik açılımı HQ seviyesine bağlı (siber, ileri UI).

17. **PWA + taktik mobil harita** — Masaüstü panel oyununa mobil harita kilidi ve dokunmatik zoom/pan.

---

## 7. Durum ve Sınırlar (Dürüst Değerlendirme)

| Alan | Durum |
|------|--------|
| UI / tek oyunculu simülasyon | Güçlü prototip |
| Tam multiplayer / sunucu otoritesi | Planlı, henüz tam değil |
| Ekonomi & savaş dengesi | Test aşaması |
| Diplomasi / ittifak backend | Kısmen UI + veri modeli |
| Küresel ülke haritası | Vizyon; şu an Türkiye odaklı |

---

## 8. İletişim ve Repo

- **Canlı önizleme:** https://stratejioyunu.vercel.app  
- **Kaynak:** https://github.com/winegg420/stratejioyunu  

*Belge, kod tabanı ve proje vizyon dokümanlarından türetilmiştir. Mekanik detaylar güncellemelerle değişebilir.*

**© 2026 Stratejioyunu Geliştirme Projesi**
