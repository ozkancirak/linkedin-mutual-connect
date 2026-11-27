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

// LinkedIn pencereleri ("Davetinize not eklensin mi?" gibi) çoğu zaman GÖLGE DOM içinde çizer (#interop-outlet).
// document.querySelectorAll gölge kökün içine bakamaz, o yüzden pencere ekranda görünür ama bizim için yok olurdu.
// Burada sayfa + gövdenin altındaki tüm gölge kökler birlikte aranır.
function roots() {
  const out = [document];
  const add = (el) => { if (el?.shadowRoot) out.push(el.shadowRoot); };
  add(document.querySelector("#interop-outlet"));
  add(document.querySelector('[data-testid="interop-shadowdom"]'));
  for (const c of document.body.children) add(c);
  return [...new Set(out)];
}
const deepAll = (sel) => roots().flatMap((r) => [...r.querySelectorAll(sel)]);
const DIALOGS = "[role=dialog],[role=alertdialog],dialog[open],.artdeco-modal";

// Açık pencere ya da uyarı yazısı (gitmeyen davetin sebebini anlamak için)
const popupText = () => (deepAll(DIALOGS + ",[role=alert],.artdeco-toast-item")[0]?.innerText || "").trim().replace(/\s+/g, " ");
// Tanı: gitmeyen davetteki pencerenin içini konsola yaz (düğme adları, gölge DOM var mı)
function dialogInfo() {
  const d = deepAll(DIALOGS)[0];
  return {
    pencereVar: !!d,
    gölgeKök: !!document.querySelector("#interop-outlet")?.shadowRoot,
    metin: (d?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 140),
    butonlar: d ? [...d.querySelectorAll("button,[role=button]")].map((x) => (x.getAttribute("aria-label") || "") + " | " + (x.innerText || "").trim()) : [],
  };
}
// Gitmeyen davetten kalan pencere sonrakileri engellemesin diye kapat
function closePopups() {
  for (const d of deepAll(DIALOGS)) {
    d.querySelector('[aria-label*="Kapat" i],[aria-label*="Dismiss" i],[aria-label*="Close" i],.artdeco-modal__dismiss')?.click();
  }
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}


// Bağlan'a basar ve davetin gittiğini doğrular: butonun etiketi ya da yazısı değişir ("Beklemede" vb.) ya da
// "not ekle" penceresi çıkar (onu notsuz gönderir). Sabit bekleme yok. Gitmediyse {ok:false, why: sebep}.
async function sendOne(b, wait = 2000) {
  const snap = () => (b.getAttribute("aria-label") || "") + "|" + (b.innerText || "").trim();
  const before = snap();
  b.click();
  for (let i = 0; i < wait / 40; i++) {
    await sleep(40);
    const send = noteSendBtn();
    if (send) { send.click(); await sleep(120); return { ok: true }; }
    if (!b.isConnected || snap() !== before) return { ok: true }; // buton tepki verdi
  }
  return { ok: false, why: popupText() };
}

// Gönderildi: kaydet, kopyayı soluklaştır, sayaçları güncelle
async function markDone(m) {
  m.sent = true;
  markSentUrl(m.url); // bir daha önerme
  m.clone.style.boxShadow = "";
  m.clone.style.opacity = ".55";
  const cb = [...m.clone.querySelectorAll("button")].find((x) => isConnect(x));
  if (cb) { cb.textContent = "Gönderildi"; cb.disabled = true; }
  const { sent = [] } = await chrome.storage.local.get("sent");
  await chrome.storage.local.set({ sent: [...sent.filter((t) => Date.now() - t < 7 * DAY), Date.now()] });
  await refresh();
  pop();
}

// Bir kişiyi profil sekmesinde gönderir: arka plan sekmeyi açar, sekmedeki eklenti Bağlantı kur + "Not olmadan gönder"i
// yapar ve sonucu "connectResult" olarak yazar. Burada o sonuç beklenir, bitince sekme kapatılır.
async function viaProfile(m) {
  if (!/^https?:/.test(m.url || "")) return false;
  const t0 = Date.now();
  await chrome.storage.local.set({ pendingConnect: { url: m.url, name: m.name, t: t0, auto: true } });
  const res = await chrome.runtime.sendMessage({ type: "openProfile", url: m.url }).catch(() => null);
  if (!res) { console.warn("[Otomatik Bağlan] sekme açılamadı: eklentiyi chrome://extensions sayfasında yeniden yükle"); return false; }
  let ok = false;
  for (let i = 0; i < 160 && s.status === "running"; i++) { // en çok ~40 sn
    await sleep(250);
    const { connectResult: r } = await chrome.storage.local.get("connectResult");
    if (r && r.url === m.url && r.t >= t0) { ok = r.ok; break; }
  }
  chrome.runtime.sendMessage({ type: "closeTab", tabId: res.tabId }).catch(() => {});
  return ok;
}

