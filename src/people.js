const hasConnect = (el) => [...el.querySelectorAll("button")].some((b) => isConnect(b));

// Kartı taşıyan "satır öğesi": kardeşlerinin çoğu da Bağlan butonlu kart olan en yakın ata (grid mi carousel mi fark etmez)
function itemOf(el) {
  for (let e = el; e.parentElement && e !== document.body; e = e.parentElement) {
    const sib = [...e.parentElement.children];
    if (sib.length >= 3 && sib.filter(hasConnect).length >= 3) return e;
  }
  return el;
}

// Sayfanın en üstündeki "Ortak bağlantısı olanlar" alanı. Kartların kopyaları burada durur,
// orijinaller yerinde kalır (LinkedIn'in sayfasına dokunmuyoruz, sadece yanına ekliyoruz).
let box, boxGrid;
function ensureBox(firstBtn) {
  if (box?.isConnected) return;
  const item = itemOf(firstBtn);
  let anchor = null; // ilk öneri bölümü: kardeşlerinden en az 2'sinde Bağlan butonu olan ata
  if (item !== firstBtn) {
    for (let e = item.parentElement; e && e.parentElement && e !== document.body; e = e.parentElement) {
      if ([...e.parentElement.children].filter(hasConnect).length >= 2) { anchor = e; break; }
    }
    anchor ||= item.parentElement.parentElement || item.parentElement; // tek bölüm varsa: bölümün kendisinin önüne
  }
  // Satır yapısını bulamazsak (kartlar beklenenden farklıysa) sayfanın ana alanının en başına koy,
  // asla bir kartın içine değil.
  anchor ||= document.querySelector("main")?.firstElementChild || document.body.firstElementChild;
  if (!box) {
  box = document.createElement("section");
  box.style.cssText = "background:#fff;border-radius:8px;box-shadow:0 0 0 1px rgba(0,0,0,.15);padding:16px 12px 12px;margin-bottom:8px;scroll-margin-top:90px";
  const h = document.createElement("h2");
  h.style.cssText = "margin:0 4px 12px;font:600 20px/1.3 -apple-system,system-ui,'Segoe UI',Roboto,sans-serif;color:rgba(0,0,0,.9)";
  boxGrid = document.createElement("div");
  boxGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;align-items:stretch";
  box.append(h, boxGrid);
  }
  anchor.parentElement.insertBefore(box, anchor);
}

// --- Test modu: uygun kartları mavi çerçeveler ve en üste taşır, hiçbir şey göndermez ---
// Önbellek: son 7 günde bulduğumuz kişiler {profilUrl: {n, t, sent, html}}.
// html = kartın kopyası. Sayfa yenilenince üstteki alan bununla, tarama yapmadan geri gelir.
// Davet gönderdiklerimizi bir daha önermeyiz.
let cache = {};
let saveT;
const saveCache = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    for (const k in cache) if (Date.now() - cache[k].t > 7 * DAY) delete cache[k];
    chrome.storage.local.set({ people: cache });
    console.log("[Otomatik Bağlan] kaydedildi:", Object.keys(cache).length, "kişi");
  }, 500);
};
const profileUrl = (card) => card.querySelector('a[href*="/in/"]')?.href.split("?")[0];
// Kişi anahtarı: profil adresi; bulunamazsa kartın ilk iki satırı (ad + başlık)
const personKey = (item) => profileUrl(item) || "t:" + item.innerText.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 2).join("|");
const markSentUrl = (u) => {
  if (u) { cache[u] = { ...(cache[u] || { n: 0 }), t: Date.now(), sent: true }; saveCache(); }
};
const markSent = (card) => markSentUrl(card && profileUrl(card));

const marks = []; // {card, item, clone, src, url, isNew}: üstteki alandaki her kişi
const byUrl = new Map(); // profil adresi -> kayıt (aynı kişiyi iki kez eklememek için)
const marked = new WeakSet();
let armed = false; // "Taramayı başlat"a basılınca açılır: ondan sonra gelen yeni kartlar da kendiliğinden taranır
const onGrow = () => location.pathname.startsWith("/mynetwork/");
const OUTLINE = ";outline:3px solid #0a66c2;outline-offset:2px;border-radius:10px";
const firstConnect = () => [...document.querySelectorAll("button")].find((b) => isConnect(b) && !box?.contains(b));

// Sayfada bu kişinin gerçek Bağlan butonunu bul (yenileme sonrası geri gelen kopya için)
function btnByUrl(url, name) {
  const path = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname).replace(/\/+$/, "").toLowerCase(); } catch { return ""; } };
  const want = path(url);
  for (const a of document.querySelectorAll('a[href*="/in/"]')) {
    if (box?.contains(a)) continue;
    // Aynı kişi: profil yolu aynı (sorgu parametreleri önemsiz) ya da bağlantının yazısı kişinin adı
    const same = (want && path(a.href) === want) || (name && a.textContent.trim() && a.textContent.trim().includes(name));
    if (!same) continue;
    for (let e = a; e && e !== document.body; e = e.parentElement) {
      const bs = [...e.querySelectorAll("button")].filter((b) => isConnect(b));
      if (bs.length === 1) return bs[0];
      if (bs.length > 1) break;
    }
  }
  return null;
}

// Kopyadaki Bağlan düğmesi: gerçek kart bu sayfadaysa AYNI sekmede onun düğmesine basar ("Davetinize not eklensin mi?"
// çıkarsa "Not olmadan gönder"i de tıklar). Gerçek kart sayfada yoksa profili yeni sekmede açar, orada otomatik gönderilir.
function wire(entry) {
  const cb = [...entry.clone.querySelectorAll("button")].find((x) => isConnect(x));
  cb?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (entry.busy) return; // çift tıklama
    const b = entry.src?.isConnected ? entry.src : btnByUrl(entry.url, entry.name);
    if (b) {
      entry.busy = true;
      cb.textContent = "Gönderiliyor…";
      const r = await sendOne(b, 3000); // not penceresi çıkarsa notsuz gönderir
      entry.busy = false;
      if (r.ok) {
        entry.sent = true;
        markSentUrl(entry.url);
        const { sent = [] } = await chrome.storage.local.get("sent");
        await chrome.storage.local.set({ sent: [...sent.filter((t) => Date.now() - t < 7 * DAY), Date.now()] });
        refresh();
        cb.textContent = "Gönderildi";
        cb.disabled = true;
      } else {
        cb.textContent = "Tekrar dene"; // gitmedi: açık kalan pencereyi elle halledebilirsin
        entry.clone.style.boxShadow = "0 0 0 3px #cc1016";
      }
    } else if (/^https?:/.test(entry.url || "")) { // kart bu sayfada yüklü değil: profili yeni sekmede aç, orada davet otomatik gönderilir
      chrome.storage.local.set({ pendingConnect: { url: entry.url, name: entry.name, t: Date.now() } });
      window.open(entry.url, "_blank");
    }
  }, true);
}

function addEntry(entry, n) {
  entry.n = n;
  entry.name = (entry.clone.querySelector('a[href*="/in/"]')?.textContent || "").trim(); // profil sekmesinde kişiyi doğrulamak için
  // Kopyayı KENDİ kutumuza sarıyoruz: rozet, çerçeve ve soluklaştırma LinkedIn'in elemanına değil bizim kutuya bağlı olsun.
  // (LinkedIn elemanı "display:contents" gibi kutusuz olursa rozet sayfanın başka yerine yapışıyordu.)
  const inner = entry.clone;
  inner.style.cssText += ";flex:1 1 auto;min-width:0;max-width:none;margin:0";
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;display:flex;min-width:0;border-radius:8px";
  wrap.style.order = -n; // ortağı çok olan önce
  // Köşede ortak sayısı rozeti: sıralamayı gözle görebilesin
  const badge = document.createElement("span");
  badge.textContent = n + " ortak";
  badge.style.cssText = "position:absolute;top:8px;left:8px;z-index:3;background:#0a66c2;color:#fff;border-radius:10px;padding:1px 8px;font:600 11px/18px -apple-system,system-ui,sans-serif;pointer-events:none";
  entry.badge = badge;
  wrap.append(inner, badge);
  entry.clone = wrap;
  wire(entry);
  boxGrid.append(wrap);
  marks.push(entry);
  if (entry.url) byUrl.set(entry.url, entry);
}

function refreshBox() {
  if (!box) return;
  const sorted = [...marks].sort((a, b) => b.n - a.n).map((m) => m.clone); // ortağı çok olan başta
  if (sorted.some((c, i) => boxGrid.children[i] !== c)) boxGrid.append(...sorted);
  const fresh = marks.filter((m) => m.isNew).length; // önbellekte olmayan, yani ilk kez gördüğümüz
  box.firstChild.textContent = `Ortak bağlantısı olanlar (${marks.length}${fresh && fresh < marks.length ? ` · ${fresh} yeni` : ""})`;
  box.style.display = marks.length ? "" : "none";
}

// Kaydettiğimiz kart HTML'ini güvenli şekilde elemana çevir (script ve on* olayları ayıklanır)
function htmlToEl(html) {
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll("script,iframe,object,embed").forEach((n) => n.remove());
  d.body.querySelectorAll("*").forEach((n) => [...n.attributes].forEach((a) => /^on/i.test(a.name) && n.removeAttribute(a.name)));
  const el = d.body.firstElementChild;
  return el && document.importNode(el, true);
}

// Önbellekteki kişileri tarama yapmadan üstteki alana geri koyar
function restore() {
  const f = firstConnect();
  if (!f) return;
  for (const [url, p] of Object.entries(cache)) {
    if (!p.html || p.sent || p.n < s.min || byUrl.has(url) || Date.now() - p.t > 7 * DAY) continue;
    try { ensureBox(f); } catch (e) { console.error("[Otomatik Bağlan] üst alan oluşturulamadı", e); return; }
    const clone = htmlToEl(p.html);
    if (clone) addEntry({ card: null, item: null, clone, src: null, url, isNew: false }, p.n);
  }
  refreshBox();
  set({ found: marks.length });
  console.log("[Otomatik Bağlan] geri yüklendi:", marks.length, "kişi (kayıtlı:", Object.keys(cache).length + ")");
}
let restoring = false;
async function restoreWhenReady() {
  if (restoring) return;
  restoring = true;
  for (let i = 0; i < 40 && !firstConnect(); i++) await sleep(500); // ilk kartlar gelsin (en fazla ~20 sn)
  if (onGrow()) restore();
  restoring = false;
}

// Sayfadaki yeni kartlara bir kez bakar. Elle ya da otomatik kaydırma fark etmez.
function scanOnce() {
  let seen = 0, added = 0, first;
  for (const b of document.querySelectorAll("button")) {
    if (!isConnect(b) || box?.contains(b)) continue; // kendi kopyalarımıza bakma
    seen++;
    first ||= b;
    const c = cardOf(b);
    if (!c || marked.has(c)) continue;
    const n = mutualCount(c.innerText);
    if (n < s.min) continue;
    // Profil bağlantısı (ad, fotoğraf) kartın üst kısmında, c'nin (ortak yazısı + buton) dışında kalıyor.
    // O yüzden adresi bütün karttan ara; yoksa kişi hiç kaydedilmez ve yenileyince kaybolur.
    const item = itemOf(c);
    const url = personKey(item), old = url && cache[url];
    if (old?.sent) { marked.add(c); continue; } // daha önce davet gönderdiğimiz kişiyi tekrar önerme
    marked.add(c);
    const prev = url && byUrl.get(url);
    if (prev) { // yenileme sonrası geri yüklediğimiz kişi: kopyası zaten var, gerçek karta bağla
      Object.assign(prev, { card: c, item, src: b });
      item.style.cssText += OUTLINE;
      continue;
    }
    added++;
    try { ensureBox(first); } catch (e) {
      console.error("[Otomatik Bağlan] üst alan oluşturulamadı", e);
      set({ msg: "Üst alan oluşturulamadı (konsola bak)" });
      continue;
    }
    const clone = item.cloneNode(true); // önce kopyala (çerçevesiz kalsın), sonra orijinali işaretle
    item.style.cssText += OUTLINE; // kartın tamamı
    if (url) { cache[url] = { n, t: Date.now(), sent: false, html: clone.outerHTML }; saveCache(); }
    addEntry({ card: c, item, clone, src: b, url, isNew: !old }, n);
  }
  refreshBox();
  if (seen !== s.seen || added) set({ found: marks.length, seen });
  return added;
}

// Min. ortak değişince eski işaretleri sil, baştan bak
function resetMarks() {
  for (const m of marks) {
    if (m.item) m.item.style.outline = "";
    m.clone.remove();
    if (m.card) marked.delete(m.card);
  }
  marks.length = 0;
  byUrl.clear();
  if (box) box.style.display = "none";
}

