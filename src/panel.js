// --- Durum + arayüz (Shadow DOM: LinkedIn CSS'i paneli bozmasın) ---
// Ekranın altında ortada sürüklenebilir bir hap; tıklayınca üstüne panel açılır.
const s = { min: 10, cap: 15, dry: true, today: 0, week: 0, found: 0, seen: 0, status: "idle", msg: "", open: false };
const host = document.createElement("div");
host.style.cssText = "all:initial;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);width:296px;z-index:2147483647;pointer-events:none";
if (!location.pathname.startsWith("/mynetwork/")) host.style.display = "none";
const root = host.attachShadow({ mode: "open" });
const R = 26, C = 2 * Math.PI * R; // büyük halka
const r2 = 11, C2 = 2 * Math.PI * r2; // hap içindeki mini halka
