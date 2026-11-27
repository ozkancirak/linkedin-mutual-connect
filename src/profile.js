// --- Yeni sekmede açılan profilde davet otomatik gönderilir ---
// Üstteki alanda gerçek kartı sayfada olmayan bir kişinin "Bağlantı kur"una basınca profil yeni sekmede açılır.
// Eklenti orada bağlantı kurar ve "Not olmadan gönder"e basar. SADECE o tıklamayla açılan sekmede çalışır:
// tıklamada bir "pendingConnect" kaydı bırakılır (90 sn geçerli, tek kullanımlık), başka profillere dokunmaz.
const normUrl = (u) => (u || "").split("?")[0].replace(/\/+$/, "").toLowerCase();
const normName = (x) => (x || "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

function toast(text) {
  let el = document.getElementById("ob-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "ob-toast";
    el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#191919;color:#fff;padding:10px 16px;border-radius:20px;font:600 14px -apple-system,system-ui,'Segoe UI',sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)";
    document.body.append(el);
  }
  el.textContent = text;
}

async function autoProfile() {
  const { pendingConnect: p } = await chrome.storage.local.get("pendingConnect");
  if (!p || Date.now() - p.t > 90000) return;
  // Bu sekme gerçekten o kişinin profili mi? Adres TAM tutmalı ya da ad tutmalı (LinkedIn adresi sadeleştirebilir).
  // Önek karşılaştırması yok: /in/ali ile /in/ali-yilmaz-1a2b3c farklı kişiler. "Yakın zamanda açılan herhangi bir /in/"
  // kabulü de yok: kullanıcının elle açtığı başka bir profile davet giderdi.
  const here = normUrl(location.origin + location.pathname), want = normUrl(p.url);
  let ok = here === want;
  if (!ok && location.pathname.startsWith("/in/")) {
    let h1 = null;
    for (let i = 0; i < 80 && !h1; i++) { h1 = document.querySelector("main h1"); if (!h1) await sleep(100); }
    const seen = normName(h1?.textContent), name = normName(p.name);
    ok = !!(name && seen && (seen.includes(name) || name.includes(seen)));
  }
  if (!ok) return;
  await chrome.storage.local.remove("pendingConnect"); // tek kullanımlık
  toast("Otomatik Bağlan: davet gönderiliyor…");

  // Sonucu bildir (ana sekme bekliyor). Eklentinin açtığı sekme ise kendisi kapatılır.
  const report = async (good, text) => {
    toast(text);
    await chrome.storage.local.set({ connectResult: { url: p.url, ok: good, t: Date.now() } });
    if (p.auto) setTimeout(() => chrome.runtime.sendMessage({ type: "closeTab" }).catch(() => {}), good ? 700 : 1500);
    else if (good) setTimeout(() => window.close(), 1500); // elle tıklanıp açılan sekme: izin yoksa tarayıcı kapatmaz, zararsız
  };

  // Profilin ÜST kartındaki Bağlan: sayfanın en üstündeki ilk eşleşen. Aşağıdaki "Bunları da görüntüleyenler"
  // gibi başka kişilerin butonlarına asla basmamak için sadece ilk ~800 px içine bakılır.
  const topY = (x) => x.getBoundingClientRect().top + scrollY;
  const isProfileConnect = (x) => isConnect(x) || /custom-invite/.test(x.getAttribute("href") || "");
  const findTop = () => [...document.querySelectorAll("main button,main [role=menuitem],main a")].find((x) => isProfileConnect(x) && topY(x) < 800);
  const pendingNow = () => /beklemede|pending|daveti geri çek|withdraw/i.test((document.querySelector("main")?.innerText || "").slice(0, 2500));

  let btn = null;
  for (let i = 0; i < 100 && !btn; i++) { btn = findTop(); if (!btn) await sleep(80); } // üst kart yüklensin
  if (!btn) { // Bağlan ana düğme değilse "Daha fazla" menüsünde olabilir
    const more = [...document.querySelectorAll("main button")].find((x) => topY(x) < 800 && /daha fazla|more actions|^more$/i.test((x.getAttribute("aria-label") || "") + " " + (x.innerText || "")));
    if (more) { more.click(); await sleep(250); btn = [...document.querySelectorAll("[role=menuitem],button,a")].find((x) => isProfileConnect(x) && topY(x) < 800); }
  }
  if (!btn) return report(false, "Otomatik Bağlan: Bağlantı kur butonu bulunamadı (elle dene)");

  // Sayfa tam canlanmadan yapılan ilk tıklama yutulabiliyor: etki görene kadar (en çok 5 kez) tıklamayı tekrarla
  let done = pendingNow(); // zaten bekliyorsa (davet önceden gitmiş) tekrar tıklama
  for (let attempt = 1; attempt <= 5 && !done; attempt++) {
    if (attempt > 1) toast(`Otomatik Bağlan: yeniden deniyor (${attempt}/5)…`);
    btn = btn.isConnected ? btn : findTop() || btn;
    btn.click();
    for (let i = 0; i < 28 && !done; i++) { // her denemede ~1,4 sn bekle
      await sleep(50);
      const send = noteSendBtn(); // "Davetinize not eklensin mi?" (gölge DOM dahil)
      if (send) { send.click(); await sleep(500); done = true; break; }
      if (pendingNow()) done = true;
    }
  }
  if (!done) return report(false, "Otomatik Bağlan: davet gitmedi (elle dene)");

  // Kaydet: sayaç ve önbellek (üstteki alandaki kart "Gönderildi" olsun)
  const { sent = [], people = {} } = await chrome.storage.local.get(["sent", "people"]);
  for (const k of Object.keys(people)) if (normUrl(k) === want) people[k].sent = true;
  await chrome.storage.local.set({ sent: [...sent.filter((t) => Date.now() - t < 7 * DAY), Date.now()], people });
  await report(true, "Otomatik Bağlan: davet gönderildi ✓");
}

// Başka sekme (ör. profil sekmesi) davet gönderince buradaki durumu da güncelle
chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== "local") return;
  if (ch.sent) refresh();
  if (!ch.people) return;
  for (const [k, v] of Object.entries(ch.people.newValue || {})) {
    if (!v.sent) continue;
    if (cache[k]) cache[k].sent = true; // yoksa sonraki kayıtta bizim eski halimiz üzerine yazar
    const e = byUrl.get(k);
    if (e && !e.sent) {
      e.sent = true;
      e.clone.style.opacity = ".55";
      const cb = [...e.clone.querySelectorAll("button")].find((x) => isConnect(x));
      if (cb) { cb.textContent = "Gönderildi"; cb.disabled = true; }
      set({});
    }
  }
});
if (!onGrow()) autoProfile().catch((e) => console.error("[Otomatik Bağlan]", e));

addEventListener("resize", () => render());
chrome.storage.local.get(["min", "cap", "dry", "pos", "people"]).then((v) => {
  cache = v.people || {};
  if (v.min) s.min = v.min;
  if (v.cap) s.cap = v.cap;
  if (v.dry !== undefined) s.dry = v.dry;
  if (v.pos) moveTo(v.pos.l, v.pos.b);
  render();
  refresh();
  if (onGrow()) restoreWhenReady(); // sayfa yenilenince önceki bulunanlar geri gelir
});
