// Çalışır: linkedin.com/mynetwork/* ("Tanıyor olabileceğiniz kişiler")
// Bağlan butonu: İngilizce ("Connect", "Invite X to connect") ve Türkçe ("Bağlantı kur", "...bağlantı kurmaya davet et")
const CONNECT = /invite .* to connect|^connect$|bağlantı kur|^bağlan$/i;
const MUTUAL_N = /(\d+)\s+(other\s+|diğer\s+)?(mutual|ortak)/i;
const MUTUAL_ANY = /mutual connection|ortak bağlantı/i;
const LIMIT = /invitation limit|weekly invitation|davet (sınırı|limiti)|haftalık davet/i;
const WEEK_CAP = 100; // LinkedIn'in yaklaşık haftalık tavanı (kayan 7 gün)
const DAY = 864e5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const label = (el) => (el.getAttribute("aria-label") || el.innerText || "").trim();
// Hem aria-label hem görünen yazı denenir: dile göre biri farklı olabilir (ör. Türkçede etiket başka, yazı "Bağlantı kur")
const isConnect = (b) => CONNECT.test((b.getAttribute("aria-label") || "").trim()) || CONNECT.test((b.innerText || "").trim());
const mutualCount = (text) => {
  const m = text.match(MUTUAL_N);
  if (m) return +m[1] + (m[2] ? 1 : 0); // "Eda and 5 other mutual connections" => 6
  return MUTUAL_ANY.test(text) ? 1 : 0; // "Eda is a mutual connection" => 1
};

