// --- Olaylar ---
let dragged = false;
root.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "pill") return dragged ? (dragged = false) : set({ open: !s.open });
  if (t.id === "go") return s.status === "running" ? set({ status: "idle", msg: "Durduruluyor…" }) : s.dry ? scan() : run();
  if (t.dataset.mode) {
    if (s.status === "running") return; // çalışırken mod değişmesin
    s.dry = t.dataset.mode === "scan";
    chrome.storage.local.set({ dry: s.dry });
    return render();
  }
  if (t.dataset.k) setNum(t.dataset.k, s[t.dataset.k] + +t.dataset.d);
});

// Min. ortak ya da günlük limit: sınırlar içinde kaydet. Min. değişince bulunanlar baştan süzülür.
function setNum(k, v) {
  const [lo, hi] = k === "min" ? [1, 1000] : [1, 100];
  s[k] = Math.max(lo, Math.min(hi, Math.round(v) || s[k]));
  chrome.storage.local.set({ min: s.min, cap: s.cap });
  if (k === "min") { resetMarks(); restore(); if (s.dry) scanOnce(); }
  render();
}
// Elle yazılan değer Enter'a basınca ya da kutudan çıkınca uygulanır
root.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "min" || el.id === "cap") { setNum(el.id, parseInt(el.value, 10)); el.value = s[el.id]; }
});
// Yazarken LinkedIn'in klavye kısayolları (ör. "/" ile arama) tetiklenmesin
for (const ev of ["keydown", "keyup", "keypress"]) root.addEventListener(ev, (e) => e.stopPropagation());

// Hapı sürükleyerek istediğin yere taşı (konum hatırlanır)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const moveTo = (l, b) => {
  host.style.transform = "none";
  host.style.left = clamp(l, 0, innerWidth - 296) + "px";
  host.style.bottom = clamp(b, 0, innerHeight - 60) + "px";
};
let drag = null;
root.addEventListener("pointerdown", (e) => {
  const pill = e.target.closest("#pill");
  if (!pill) return;
  const r = host.getBoundingClientRect();
  drag = { x: e.clientX, y: e.clientY, l: r.left, b: innerHeight - r.bottom, moved: false };
  pill.setPointerCapture(e.pointerId);
});
root.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  drag.moved = true;
  moveTo(drag.l + dx, drag.b - dy);
  if (s.open) render(); // sürüklerken yön güncellensin
});
root.addEventListener("pointerup", () => {
  if (drag?.moved) {
    dragged = true; // hemen ardından gelen click paneli açmasın
    const r = host.getBoundingClientRect();
    chrome.storage.local.set({ pos: { l: r.left, b: innerHeight - r.bottom } });
    render();
  }
  drag = null;
});

// --- Sayfa takibi: sadece /mynetwork/ altında görün. Sayfa açılınca kendiliğinden hiçbir şey başlamaz. ---
// LinkedIn bir SPA: sayfa yenilenmeden adres değişir, o yüzden adresi izliyoruz.
let lastPath = "";
setInterval(() => { // LinkedIn içeriği yeniden çizerken üstteki alanı silebilir, silinirse geri koy
  if (box && !box.isConnected && marks.length && onGrow()) {
    const f = firstConnect();
    if (f) try { ensureBox(f); } catch (e) { console.error("[Otomatik Bağlan]", e); }
  }
}, 1000);
setInterval(() => {
  if (location.pathname === lastPath) return;
  lastPath = location.pathname;
  const on = onGrow();
  host.style.display = on ? "" : "none";
  if (!on) armed = false; // sayfadan çıkınca izleme kapanır, tekrar "Taramayı başlat" gerekir
  else restoreWhenReady(); // kayıtlı kişileri geri koy (tarama yapmaz)
}, 1000);

