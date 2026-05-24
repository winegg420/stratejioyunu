# Türkiye haritası — global revizyon öncesi geri dönüş

Bu dosya, **dünya/ülke haritası revizyonu** öncesinde kaydedilen stabil Türkiye sürümüne dönmek içindir.

## Etiket (tag)

| Etiket | Açıklama |
|--------|----------|
| `stable-tr-pre-global` | Çalışan TR haritası: pan, etiketler, React #185 düzeltmeleri, SW v73 |

## Geri dönüş (yerel)

```bash
git fetch --tags
git checkout stable-tr-pre-global
npm install
npm run build
npm run deploy
```

Yeni branch’te denemek için:

```bash
git checkout -b restore-tr-map stable-tr-pre-global
```

## Revizyon sırasında

- Harita çekirdeği **kopyalanmaz**, `map` + store **genişletilir**.
- Ülke revizyonu bitmeden önce: `npm run check:guards`, `npm run build`, `node scripts/repro-nav-185.mjs` (dev sunucu açıkken).

## Mega Şehir / global tasarım notları

Revizyon gereksinimleri sohbet özetinde; kod bu etiketten **sonra** başlar.
