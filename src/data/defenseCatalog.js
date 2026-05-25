/** Üs savunma sistemleri — adet üretimi + kademe yükseltme */

export const DEFENSE_MAX_LEVEL = 15;

export const DEFENSE_SYSTEMS = [
  {
    id: 'firewall',
    name: 'Siber Güvenlik Duvarı',
    version: 'Firewall v1.0',
    icon: '🛡️',
    desc: 'Ağ altyapısını koruyan ilk dijital savunma hattıdır. Gelen hafif siber sızmaları, veri hırsızlığı girişimlerini ve düşman casus dronlarını saniyeler içinde tespit edip sistem dışına atar.',
    unitCost: '600 hammadde · 450 bütçe',
    unitTime: '00:01:45',
    upgradeCost: '900 hammadde · 700 bütçe',
    upgradeTime: '00:12:00',
  },
  {
    id: 'korkut',
    name: 'Korkut Mobil Uçaksavar Sistemi',
    version: 'KORKUT',
    icon: '🎯',
    desc: 'Alçak irtifadan sinsice yaklaşan seyir füzelerini, helikopterleri ve kamikaze drone sürülerini namlu gücüyle havada imha eden, yüksek hareket kabiliyetine sahip mobil savunma aracıdır.',
    unitCost: '1200 hammadde · 800 bütçe · 120 petrol',
    unitTime: '00:03:20',
    upgradeCost: '1400 hammadde · 950 bütçe',
    upgradeTime: '00:18:00',
  },
  {
    id: 'gokdeniz',
    name: 'Gökdeniz Yarı Otomatik CIWS',
    version: 'GÖKDENİZ CIWS',
    icon: '🔫',
    desc: 'Üssün merkezine yerleştirilen radar güdümlü döner namlulu sistem. Üzerine gelen ağır füzeleri ve yaklaşan zırhlı kara araçlarını saniyede 75 mermi fırlatarak zırh delici mühimmatla eritir.',
    unitCost: '1800 hammadde · 1100 bütçe · 200 petrol',
    unitTime: '00:04:10',
    upgradeCost: '2000 hammadde · 1300 bütçe',
    upgradeTime: '00:22:00',
  },
  {
    id: 'akkor',
    name: 'Akkor Elektromanyetik Top',
    version: 'Railgun',
    icon: '⚡',
    desc: 'Barut veya yakıt kullanmaz; saf elektrik enerjisini kinetik güce dönüştürerek mermiyi ses hızının 7 katına çıkarır. En ağır zırhlı tankları ve kruvazörleri tek atışta delip geçmek için tasarlanmıştır.',
    unitCost: '2400 hammadde · 1600 bütçe · 350 enerji',
    unitTime: '00:05:30',
    upgradeCost: '2800 hammadde · 1900 bütçe · 200 enerji',
    upgradeTime: '00:28:00',
  },
  {
    id: 'siper',
    name: 'Siper Uzun Menzilli Füze Bataryası',
    version: 'SİPER',
    icon: '🚀',
    desc: 'Yüzlerce kilometre öteden fırlatılan balistik ve seyir füzelerini hava sahanıza girmeden algılar. Karşı önleme füzesi ateşleyerek tehditleri stratosferde imha eden ana şemsiyedir.',
    unitCost: '3200 hammadde · 2200 bütçe · 500 petrol',
    unitTime: '00:06:45',
    upgradeCost: '3600 hammadde · 2500 bütçe',
    upgradeTime: '00:35:00',
  },
  {
    id: 'demir_kubbe',
    name: 'Demir Kubbe Enerji Kalkanı',
    version: 'Iron Dome Shield',
    icon: '🔮',
    desc: 'Üretimi en maliyetli son kademe savunmadır. Şehrin üstünü kaplayan siber-fiziksel kalkan jeneratörü; düşman ordusu ve füze saldırılarının büyük bölümünü absorbe ederek içeri sızdırmaz.',
    unitCost: '5000 hammadde · 4000 bütçe · 800 enerji · 25 uranyum',
    unitTime: '00:09:00',
    upgradeCost: '5500 hammadde · 4500 bütçe · 400 enerji',
    upgradeTime: '00:45:00',
  },
];

export const DEFENSE_BY_ID = Object.fromEntries(
  DEFENSE_SYSTEMS.map((d) => [d.id, d]),
);
