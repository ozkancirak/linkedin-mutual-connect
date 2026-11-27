// --- Gönderim hızı: seri, mola yok. Sadece iki davet arası kısa rastgele bekleme (ms) ---
const GAP = [450, 1000];
const SEND_NOTE = /(olmadan|eklemeden) gönder|send without|without a note|^send$|^gönder$/i; // "not ekle" penceresinden notsuz gönder

// "Davetinize not eklensin mi?" penceresindeki "Not olmadan gönder" butonu (gölge DOM dahil). Etiketi ve yazısı
// ayrı ayrı denenir (dile göre biri farklı olabilir). Düğme adından tanıyamazsa pencerenin başlığından tanır.
function noteSendBtn() {
  const asBtn = "button,[role=button]";
  for (const d of deepAll(DIALOGS)) {
    const btns = [...d.querySelectorAll(asBtn)];
    const hit = btns.find((x) => SEND_NOTE.test((x.getAttribute("aria-label") || "").trim()) || SEND_NOTE.test((x.innerText || "").trim()));
    if (hit) return hit;
    if (/not eklensin mi|add a note/i.test(d.innerText)) { // "Not ekleyin" ve kapatma dışındaki birincil düğme
      const alt = btns.filter((x) => !/not ekle|add a note|kapat|dismiss|close/i.test((x.getAttribute("aria-label") || "") + " " + (x.innerText || "")));
      if (alt.length) return alt[alt.length - 1];
    }
  }
  // Son çare: pencere kapsayıcısını tanıyamadıysak bile, sayfanın herhangi yerinde (gölge dahil) görünür "Not olmadan gönder"
  const strong = /(olmadan|eklemeden) gönder|send without|without a note/i;
  return deepAll(asBtn).find((x) => (strong.test(x.getAttribute("aria-label") || "") || strong.test((x.innerText || "").trim())) && x.getClientRects().length > 0) || null; // görünür mü
}

