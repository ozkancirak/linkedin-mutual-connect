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
  // Buton DOM'dan koptuysa LinkedIn listeyi yeniden çizmiş olabilir: aynı kişinin Bağlan butonu hâlâ sayfadaysa davet gitmemiştir
  const who = b.getAttribute("aria-label");
  const stillConnect = () => !!who && [...document.querySelectorAll("button")].some((x) => x.getAttribute("aria-label") === who && isConnect(x));
  b.click();
  for (let i = 0; i < wait / 40; i++) {
    await sleep(40);
    const send = noteSendBtn();
    if (send) { send.click(); await sleep(120); return { ok: true }; }
    if (b.isConnected ? snap() !== before : !stillConnect()) return { ok: true }; // buton tepki verdi
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
async function viaProfile(m, id) {
  if (!/^https?:/.test(m.url || "")) return false;
  const t0 = Date.now();
  await chrome.storage.local.set({ pendingConnect: { url: m.url, name: m.name, t: t0, auto: true } });
  const res = await chrome.runtime.sendMessage({ type: "openProfile", url: m.url }).catch(() => null);
  if (!res) { console.warn("[Otomatik Bağlan] sekme açılamadı: eklentiyi chrome://extensions sayfasında yeniden yükle"); return false; }
  let ok = false;
  for (let i = 0; i < 160 && alive(id); i++) { // en çok ~40 sn
    await sleep(250);
    const { connectResult: r } = await chrome.storage.local.get("connectResult");
    if (r && r.url === m.url && r.t >= t0) { ok = r.ok; break; }
  }
  chrome.runtime.sendMessage({ type: "closeTab", tabId: res.tabId }).catch(() => {});
  return ok;
}

// --- Ana döngü: "Bul ve gönder" ---
// Daha önce sayfa sonuna kadar tarandıysa taramaz, bulunanlara direkt gönderir.
// Taranmadıysa taramayla gönderim AYNI ANDA yürür: bir kişi bulunur bulunmaz sıradaki davet gider,
// taramanın bitmesi beklenmez. Gönderen hep o an bulunanlar arasında ortağı en çok olanı seçer.
async function run() {
  const id = ++runId;
  // Durumu sadece bu tur hâlâ güncelse yaz: Durdur'a basılmış eski tur, yeni turun durumunu ezmesin
  const done = (o) => id === runId && set(o);
  set({ status: "running", msg: "" });
  let scanning = !scanned; // tarama hâlâ sürüyor mu
  if (scanning) scan(true, id).finally(() => { scanning = false; }); // hata verse de bayrak düşer, yoksa döngü sonsuza dek bekler
  else {
    if (!marks.some((m) => !m.sent)) return done({ status: "idle", msg: "Gönderilecek kişi yok" });
    box.scrollIntoView({ block: "start", behavior: "instant" }); // gönderimi üstteki alandan izle
  }

  // Bir kişiyi dener. "" = gitti, "LIMIT" = LinkedIn limit uyarısı verdi, başka yazı = gitmedi (sebep)
  const attempt = async (m, retry) => {
    let b = m.src?.isConnected ? m.src : null;
    if (b && /^https?:/.test(m.url || "")) { // saklı buton hâlâ bu kişinin kartında mı?
      const c = cardOf(b);
      if (!c || personKey(itemOf(c)) !== m.url) b = null;
    }
    b ||= btnByUrl(m.url, m.name);
    if (!b) return "kart sayfada bulunamadı"; // kayıttan geri gelmiş, bu sayfada yüklü değil
    if (!scanning) m.clone.scrollIntoView({ block: "nearest", behavior: "smooth" }); // tarama sürerken sayfayı oynatma
    m.clone.style.boxShadow = "0 0 0 3px #057642"; // şu an gönderilen
    if (retry) b.scrollIntoView({ block: "center", behavior: "instant" }); // 2. tur: kartı görünür yapıp yavaşça dene
    const r = await sendOne(b, retry ? 3500 : 2000);
    if (!r.ok) {
      m.clone.style.boxShadow = "0 0 0 3px #cc1016"; // kırmızı: gitmedi
      console.warn("[Otomatik Bağlan] gitmedi:", { kişi: m.url, sebep: r.why || "buton tepki vermedi", buton: b.outerHTML.slice(0, 220), gizli: b.offsetParent === null, pasif: !!(b.disabled || b.getAttribute("aria-disabled")), denemeTuru: retry ? 2 : 1, pencere: dialogInfo() });
      if (LIMIT.test(r.why)) return "LIMIT";
      closePopups();
      return r.why || "buton tepki vermedi";
    }
    await markDone(m);
    return LIMIT.test(popupText()) ? "LIMIT" : ""; // gitti ama LinkedIn limit uyarısı da verdiyse dur
  };
  // busy: bu kişi şu an gönderiliyor. Durdur + Başlat ile gelen yeni tur aynı kişiye ikinci kez tıklamasın.
  const tryOne = async (m, retry) => {
    m.busy = true;
    try { return await attempt(m, retry); } finally { m.busy = false; }
  };
  // Günlük/haftalık sınıra ulaşıldıysa durma durumunu döner
  const gate = async () => {
    await refresh();
    if (s.today >= s.cap) return { status: "idle", msg: "Günlük limite ulaşıldı 🎉" };
    if (s.week >= WEEK_CAP) return { status: "limit", msg: "Haftalık limite ulaşıldı" };
  };
  const stopLimit = () => done({ status: "limit", msg: "LinkedIn davet limitine ulaştı" });

  const failed = []; // [kişi, sebep]
  let streak = 0; // üst üste gitmeyen davet sayısı
  const tried = new Set();
  let seq = 0; // gönderim sırası numarası
  while (alive(id)) { // 1. tur: hızlı, bulundukça gönder
    const next = marks.filter((m) => !m.sent && !m.busy && !tried.has(m)).sort((a, b) => b.n - a.n)[0];
    if (!next) {
      if (scanning) { await sleep(100); continue; } // tarama yeni kişi bulana kadar bekle
      break; // tarama bitti ve sıra boş
    }
    const stop = await gate();
    if (stop) { scanning = false; return done(stop); }
    tried.add(next);
    if (next.badge) next.badge.textContent = `#${++seq} · ${next.n} ortak`; // gönderim sırası kartta görünsün
    const r = await tryOne(next, false);
    if (r === "LIMIT") return stopLimit();
    if (r) {
      failed.push([next, r]);
      if (r !== "kart sayfada bulunamadı" && ++streak >= 10) { // LinkedIn yanıt vermiyor: ısrar etme, hesabı yorma
        return done({ status: "limit", msg: `Üst üste ${streak} davet gitmedi: ${r.slice(0, 60)}. Biraz bekleyip tekrar dene.` });
      }
    } else streak = 0;
    await sleep(rand(...GAP)); // sıradakine geç
  }
  if (!alive(id)) return; // Durdur'a basıldı: durumu o taraf zaten ayarladı

  if (failed.length) { // 2. tur: sayfada gitmeyenleri (çoğu "not ekle" isteyenler) profil sekmesini KENDİSİ açıp gönderir
    for (const f of [...failed]) {
      if (!alive(id)) break;
      const stop = await gate();
      if (stop) return done(stop);
      done({ msg: `Profil sekmesinde gönderiliyor (${failed.length} kişi kaldı)` });
      const ok = await viaProfile(f[0], id);
      if (ok) {
        failed.splice(failed.indexOf(f), 1);
        f[0].sent = true;
        f[0].clone.style.boxShadow = "";
        f[0].clone.style.opacity = ".55";
        const cb = [...f[0].clone.querySelectorAll("button")].find((x) => isConnect(x));
        if (cb) { cb.textContent = "Gönderildi"; cb.disabled = true; }
        await refresh();
        pop();
      } else f[1] = "profil sekmesinde de gitmedi";
      await sleep(rand(...GAP));
    }
    if (alive(id)) box.scrollIntoView({ block: "start", behavior: "instant" });
  }
  if (failed.length) console.log("[Otomatik Bağlan] gitmeyen davetler:", failed.map(([m, why]) => m.clone.innerText.split("\n")[1] + " → " + why));
  const sentAny = marks.some((m) => m.sent);
  const msg = failed.length ? `${failed.length} davet gitmedi: ${failed[0][1].slice(0, 70)}`
    : sentAny ? "Bitti" : "Gönderilecek kişi yok";
  done({ status: "idle", msg });
}

