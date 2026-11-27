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

