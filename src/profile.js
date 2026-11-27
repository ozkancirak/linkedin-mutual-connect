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

