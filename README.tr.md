# LinkedIn Mutual Connect

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
![sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-0.1.0-blue)
![lisans](https://img.shields.io/badge/lisans-MIT-green)

LinkedIn'in **"Tanıyor olabileceğiniz kişiler"** sayfasını tarayan, **ortak bağlantısı çok olan** kişileri sayfanın
en üstünde listeleyen ve onlara bağlantı daveti gönderen Chrome eklentisi (Manifest V3).

🇬🇧 [English README](README.md)

> ⚠️ **Önce bunu oku.** LinkedIn [Kullanıcı Sözleşmesi](https://www.linkedin.com/legal/user-agreement) siteyi
> otomatikleştirmeyi yasaklar. Bu aracı kullanmak hesabının **kısıtlanmasına** yol açabilir. Erken sürüm (0.x) bir
> hobi projesidir, olduğu gibi sunulur ve **kullanım sorumluluğu sana aittir**. Düşük bir günlük limitle başla.

## Ne yapar

- `linkedin.com/mynetwork/*` sayfasının altında küçük, sürüklenebilir bir hap olarak durur, tıklayınca panel açılır.
- **Sadece bul** modu: tüm öneri listesini kendisi kaydırır, en az girdiğin sayıda ortak bağlantısı olanları süzer ve
  sayfanın en üstünde **"Ortak bağlantısı olanlar"** kutusunda çoktan aza sıralı gösterir. Hiçbir şey göndermez.
- **Bul ve gönder** modu: bu kişilere sırayla (ortağı en çok olandan başlayarak) günlük limite kadar davet gönderir.
  Sayfayı daha önce taradıysan tekrar taramaz. Tarama ve gönderim aynı anda da yürüyebilir.
- "Davetinize not eklensin mi?" penceresini otomatik geçer (**notsuz** gönderir).
- Liste sayfasında daveti gitmeyen kişileri, eklentinin yönettiği bir sekmede profilini açıp gönderir ve sekmeyi kapatır.
- Bulunan kişileri 7 gün hatırlar (sayfayı yenileyince kaybolmaz) ve daha önce davet gönderdiğin kişiyi bir daha önermez.
- Türkçe ve İngilizce LinkedIn arayüzüyle çalışır.

## Kurulum (paketlenmemiş)

1. Bu depoyu indir ya da klonla.
2. `chrome://extensions` sayfasını aç ve **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle**'ye bas ve `manifest.json`'un olduğu klasörü seç.
4. <https://www.linkedin.com/mynetwork/grow/> sayfasını aç ve alttaki hapa tıkla.

Bir dosyayı değiştirince eklentide **Yeniden yükle**'ye bas ve LinkedIn sekmesini yenile.

## Kullanım

| Ayar | Anlamı |
| --- | --- |
| **Sadece bul / Bul ve gönder** | Mod anahtarı. "Sadece bul" hiçbir zaman davet göndermez. |
| **Min. ortak bağlantı** | En az bu kadar ortak bağlantısı olanlar listelenir (1–1000). Sayıyı elle yazabilirsin. |
| **Günlük limit** | Günde en çok gönderilecek davet (1–100). Kayan 7 günde en çok 100 davet sınırı her zaman uygulanır. |

Hap istediğin yere sürüklenir, konum hatırlanır. Hap ekranın üstündeyse panel aşağı doğru açılır.

## Rahatsız etmeden çalışması

- Sen düğmeye basmadan hiçbir şey başlamaz. Tarama ve gönderim kendiliğinden başlamaz.
- LinkedIn davet limiti uyarısı verirse ya da üst üste 10 davet gitmezse durur.
- İstediği tek izin `storage`. **Kendi başına ağ isteği yapmaz**, analitik yoktur. Ayarlar, sayaçlar ve bulduğu
  kartların önbelleği makinende `chrome.storage.local` içinde kalır.

## Sınırlamalar

- LinkedIn arayüzünü sık değiştirir, seçicilerin güncellenmesi gerekebilir. Mantık sahte sayfalar ve birim testlerle
  sınanıyor, CI'da gerçek bir LinkedIn hesabıyla değil.
- Arayüz metinleri Türkçe.
- Çok sayıda daveti hızlı göndermek LinkedIn'e otomasyon gibi görünür. Özellikle yeni hesaplarda günlük limiti düşük tut.

## Proje yapısı

```
manifest.json      MV3 manifest (içerik betikleri yazılı sırayla yüklenir, tek global kapsamı paylaşır)
background.js      servis çalışanı: içerik betiği için profil sekmelerini açar/kapatır
src/core.js        sabitler, ortak sayısı ayrıştırma, Bağlan butonu tanıma, sayaçlar
src/panel.js       hap + panel arayüzü (shadow DOM), çizim ve durum
src/people.js      öneri taraması, "ortak bağlantısı olanlar" kutusu, önbellek
src/send.js        davet gönderimi, not penceresi (gölge DOM dahil), limitler, yeniden denemeler
src/events.js      panel kontrolleri, sürükleme, sayfa takibi
src/profile.js     profil sekmesi akışı, sekmeler arası eşitleme, başlangıç
test/              birim testleri (node --test)
scripts/check.js   CI'da kullanılan statik kontroller
```

## Geliştirme

Bağımlılık yok, Node 18+ yeter.

```bash
npm run check   # manifest dosyaları var mı, JS sözdizimi, sürümler tutuyor mu, asgari izin
npm test        # ayrıştırma ve tanıma için birim testleri
```

Commit'ler [Conventional Commits](https://www.conventionalcommits.org/) biçimindedir.

## Lisans

[MIT](LICENSE)
