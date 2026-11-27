// --- Durum + arayüz (Shadow DOM: LinkedIn CSS'i paneli bozmasın) ---
// Ekranın altında ortada sürüklenebilir bir hap; tıklayınca üstüne panel açılır.
const s = { min: 10, cap: 15, dry: true, today: 0, week: 0, found: 0, seen: 0, status: "idle", msg: "", open: false };
const host = document.createElement("div");
host.style.cssText = "all:initial;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);width:296px;z-index:2147483647;pointer-events:none";
if (!location.pathname.startsWith("/mynetwork/")) host.style.display = "none";
const root = host.attachShadow({ mode: "open" });
const R = 26, C = 2 * Math.PI * R; // büyük halka
const r2 = 11, C2 = 2 * Math.PI * r2; // hap içindeki mini halka
root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box;font-family:-apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",sans-serif}
  .col{--blue:#0a66c2;--blue-h:#004182;--green:#057642;--red:#cc1016;--line:#e0dfdc;--soft:#f4f2ee;--muted:#666;--text:#191919;
    position:relative;height:44px;display:flex;justify-content:center;color:var(--text)}
  .pill{all:unset;box-sizing:border-box;pointer-events:auto;display:flex;align-items:center;gap:8px;height:44px;max-width:296px;padding:0 14px 0 8px;border-radius:22px;
    background:#fff;border:1px solid var(--line);box-shadow:0 4px 16px rgba(0,0,0,.18);cursor:grab;user-select:none;touch-action:none;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .2s}
  .pill:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.22)}
  .pill:active{cursor:grabbing;transform:scale(.97)}
  .pill svg{flex:none}
  .pill b{font-size:14px;font-weight:600;white-space:nowrap}
  .tag{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
  .chev{transition:transform .35s cubic-bezier(.34,1.4,.64,1)}
  .open .chev{transform:rotate(180deg)}
  .running .pill{animation:pulse 1.8s ease-out infinite}
  @keyframes pulse{0%{box-shadow:0 4px 16px rgba(0,0,0,.18),0 0 0 0 rgba(10,102,194,.4)}100%{box-shadow:0 4px 16px rgba(0,0,0,.18),0 0 0 10px rgba(10,102,194,0)}}
  .ring circle,.pill circle{fill:none;stroke-linecap:round}
  .pill .bg{stroke:var(--line);stroke-width:3.5}.pill .fg{stroke-width:3.5}
  .ring .bg{stroke:var(--line);stroke-width:6}.ring .fg{stroke-width:6}
  .fg{stroke:var(--blue);transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1),stroke .3s}
  .limit .fg{stroke:var(--red)} .limit .tag{color:var(--red)}
  .card{position:absolute;bottom:54px;left:0;right:0;pointer-events:none;padding:16px;border-radius:16px;background:#fff;border:1px solid var(--line);
    box-shadow:0 0 0 1px rgba(0,0,0,.03),0 12px 36px rgba(0,0,0,.22);transform-origin:bottom center;transform:scale(.9) translateY(14px);opacity:0;
    transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .2s}
  .open .card{pointer-events:auto;transform:none;opacity:1}
  /* hap ekranın üstündeyse panel hapın ALTINA açılır */
  .down .card{bottom:auto;top:54px;transform-origin:top center;transform:scale(.9) translateY(-14px)}
  .col.open.down .card{transform:none}
  .col.down .chev{transform:rotate(180deg)} /* aşağı açılan panelde ok: kapalıyken ˅, açıkken ˄ */
  .col.down.open .chev{transform:rotate(0deg)}
  .hero{display:flex;align-items:center;gap:14px;padding-bottom:14px}
  .ring{position:relative;width:64px;height:64px;flex:none}
  .ring svg{transform:rotate(-90deg)}
  .ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:15px;font-weight:600}
  .pop{animation:pop .5s cubic-bezier(.34,1.56,.64,1)}
  @keyframes pop{40%{transform:scale(1.15)}}
  .hint{font-size:12.5px;line-height:1.4;color:var(--muted)}
  .hint b{color:var(--text);font-weight:600}
  .seg{position:relative;display:grid;grid-template-columns:1fr 1fr;background:var(--soft);border-radius:20px;padding:3px;margin-bottom:6px}
  .seg i{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:17px;background:var(--blue);
    transition:transform .4s cubic-bezier(.34,1.4,.64,1),background .25s}
  .seg.send i{transform:translateX(100%);background:var(--green)}
  .seg button{all:unset;box-sizing:border-box;position:relative;z-index:1;height:32px;text-align:center;line-height:32px;font-size:13px;font-weight:600;
    color:var(--muted);cursor:pointer;transition:color .2s}
  .seg button.on{color:#fff}
  /* Çalışıyor göstergesi: halka döner (sade) */
  @keyframes rot{from{transform:rotate(-90deg)}to{transform:rotate(270deg)}}
  .running .ring svg{animation:rot 1.1s linear infinite}
  .running .rg{animation:rot 1.1s linear infinite}
  .ver{margin-top:8px;text-align:center;font-size:11px;color:#999}
  .scan .lim{display:none} /* "Sadece bul" modunda limit ve haftalık çubuk gereksiz */
  .row{display:flex;align-items:center;justify-content:space-between;font-size:13px;padding:8px 0}
  .step{display:flex;align-items:center;border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .step button{all:unset;width:30px;height:28px;text-align:center;line-height:26px;font-size:17px;color:var(--blue);cursor:pointer;transition:background .15s}
  .step button:hover{background:#eaf4fe} .step button:active{background:#d0e8ff}
  .step input{all:unset;width:36px;text-align:center;font-size:13px;font-weight:600;color:var(--text);cursor:text;border-radius:6px}
  .step input:focus{background:#eaf4fe}
  .step input::-webkit-outer-spin-button,.step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  .week{margin:6px 0 14px}
  .week div{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px}
  .bar{height:6px;border-radius:9px;background:var(--line);overflow:hidden}
  .bar i{display:block;height:100%;width:0;border-radius:9px;background:var(--blue);transition:width .8s cubic-bezier(.22,1,.36,1)}
  .go{all:unset;box-sizing:border-box;display:block;width:100%;height:40px;line-height:38px;text-align:center;border-radius:20px;border:1px solid var(--blue);
    background:var(--blue);color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s,color .2s,transform .15s}
  .go:hover{background:var(--blue-h);border-color:var(--blue-h)} .go:active{transform:scale(.98)}
  .send .go{background:var(--green);border-color:var(--green)}
  .running .go,.running .go:hover{background:#fff;color:var(--blue);border-color:var(--blue)}
  .running .go:hover{background:#eaf4fe}
</style>
<div class="col" id="col">
  <div class="card" id="card">
    <div class="hero">
      <div class="ring" id="ring"><svg width="64" height="64" viewBox="0 0 64 64">
        <circle class="bg" cx="32" cy="32" r="${R}"/><circle class="fg" id="fg" cx="32" cy="32" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
        <b id="num">0</b></div>
      <div class="hint" id="hint"></div>
    </div>
    <div class="seg" id="seg"><i></i><button data-mode="scan">Sadece bul</button><button data-mode="send">Bul ve gönder</button></div>
    <div class="row">Min. ortak bağlantı
      <div class="step"><button data-k="min" data-d="-1">−</button><input id="min" type="number" min="1" max="1000" inputmode="numeric"><button data-k="min" data-d="1">+</button></div></div>
    <div class="row lim">Günlük limit
      <div class="step"><button data-k="cap" data-d="-1">−</button><input id="cap" type="number" min="1" max="100" inputmode="numeric"><button data-k="cap" data-d="1">+</button></div></div>
    <div class="week lim"><div><span>Bu hafta (kayan 7 gün)</span><span id="wk"></span></div><div class="bar"><i id="bar"></i></div></div>
    <button class="go" id="go"></button>
    <div class="ver"></div>
  </div>
  <button class="pill" id="pill">
    <svg width="28" height="28" viewBox="0 0 28 28">
      <g class="rg" style="transform:rotate(-90deg);transform-origin:14px 14px"><circle class="bg" cx="14" cy="14" r="${r2}"/><circle class="fg" id="fg2" cx="14" cy="14" r="${r2}" stroke-dasharray="${C2}" stroke-dashoffset="${C2}"/></g>
      <path d="M14 10.5v7M10.5 14h7" stroke="#0a66c2" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
    <b>Otomatik Bağlan</b><span class="tag" id="tag"></span>
    <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>
  </button>
</div>`;
document.body.append(host);
const version = chrome.runtime.getManifest().version; // sürüm tek yerde: manifest.json
console.log(`[Otomatik Bağlan] v${version} yüklendi`);
const $ = (id) => root.getElementById(id);
root.querySelector(".ver").textContent = `v${version}`;

// Halka yanındaki özet: kaç kişi bulundu, bunlardan kaçına davet gidecek
function info() {
  if (s.dry) return "Sadece kişi bulur, davet göndermez.";
  if (!marks.length) return "Henüz kimse bulunmadı. Başlat önce arar, sonra gönderir.";
  const unsent = marks.filter((m) => !m.sent).length, sentN = marks.length - unsent;
  const plan = Math.min(unsent, Math.max(0, s.cap - s.today)); // günlük limite kadar, ortağı çok olandan başlayarak
  return `<b>${marks.length}</b> kişi bulundu${sentN ? ` · ${sentN} gönderildi` : ""}<br>` +
    (plan ? `<b>${plan}</b> kişiye davet gönderilecek` : unsent ? "Günlük limite ulaşıldı" : "Gönderilecek kişi kalmadı");
}

function render() {
  // Panel yönü: hapın üstünde panel kadar yer yoksa ve altı daha genişse aşağı aç
  const pr = $("pill").getBoundingClientRect();
  if (pr.height) s.down = pr.top < $("card").offsetHeight + 16 && innerHeight - pr.bottom > pr.top;
  $("col").className = `col ${s.open ? "open" : ""} ${s.down ? "down" : ""} ${s.status} ${s.dry ? "scan" : "send"}`;
  for (const k of ["min", "cap"]) if (root.activeElement !== $(k)) $(k).value = s[k]; // yazarken değeri ezme
  // Tarama modunda halka "bulunan / görülen", gönderme modunda "bugün / limit"
  $("num").textContent = s.dry ? s.found : `${s.today}/${s.cap}`;
  let p = s.dry ? (s.seen ? s.found / s.seen : 0) : Math.min(1, s.today / s.cap); // tarama: bulunan / görülen
  if (s.status === "running") p = Math.max(p, 0.22); // dönen yay görünsün
  $("fg").style.strokeDashoffset = C * (1 - p);
  $("fg2").style.strokeDashoffset = C2 * (1 - p);
  $("wk").textContent = `${s.week}/${WEEK_CAP}`;
  $("bar").style.width = `${Math.min(100, (s.week / WEEK_CAP) * 100)}%`;
  // Yazı sadece önemli durumlarda (limit, hata, gönderim) çıkar. Tarama sayıları halkada.
  $("tag").textContent = s.msg || (s.dry ? (s.found ? `${s.found} kişi` : "") : `${s.today}/${s.cap}`);
  $("hint").innerHTML =
    (s.msg ? s.msg + "<br>" : "") +
    info();
  $("seg").className = "seg " + (s.dry ? "scan" : "send");
  root.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", (b.dataset.mode === "scan") === s.dry));
  $("go").textContent = s.status === "running" ? "Durdur" : s.dry ? "Taramayı başlat" : "Başlat ve gönder";
}
