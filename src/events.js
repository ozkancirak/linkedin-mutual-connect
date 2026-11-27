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

