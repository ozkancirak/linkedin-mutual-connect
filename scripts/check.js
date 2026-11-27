// Bağımlılıksız statik kontrol (CI'da ve elle `npm run check` ile çalışır):
// manifest'te anılan dosyalar var mı, JS sözdizimi doğru mu, unutulan dosya var mı, sürümler tutuyor mu.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let bad = 0;
const ok = (m) => console.log("✓ " + m);
const fail = (m) => { console.error("✗ " + m); bad++; };

const manifest = JSON.parse(read("manifest.json"));
const pkg = JSON.parse(read("package.json"));

// 1) manifest'te anılan her dosya var mı
const files = [...(manifest.content_scripts || []).flatMap((c) => c.js || []), manifest.background?.service_worker].filter(Boolean);
for (const f of files) fs.existsSync(path.join(root, f)) ? ok(`manifest dosyası var: ${f}`) : fail(`manifest'te anılan dosya yok: ${f}`);

// 2) JS sözdizimi (çalıştırmadan derler)
for (const f of files.filter((f) => fs.existsSync(path.join(root, f)))) {
  try { new vm.Script(read(f), { filename: f }); ok(`sözdizimi doğru: ${f}`); } catch (e) { fail(`sözdizimi hatası ${f}: ${e.message}`); }
}

// 3) src/ altında olup manifest'e yazılmamış dosya var mı (içerik betikleri sırayla yüklenir, unutulursa çalışmaz)
const srcDir = path.join(root, "src");
if (fs.existsSync(srcDir)) for (const f of fs.readdirSync(srcDir)) if (!files.includes("src/" + f)) fail(`src/${f} manifest'te listelenmemiş`);

// 4) sürüm tek yerden yönetilir: manifest ve package.json aynı olmalı
manifest.version === pkg.version ? ok(`sürüm eşleşiyor: ${pkg.version}`) : fail(`manifest (${manifest.version}) ile package.json (${pkg.version}) sürümü farklı`);

// 5) en az yetki: sadece "storage"
const perms = (manifest.permissions || []).join(",");
perms === "storage" ? ok("izinler: sadece storage") : fail(`beklenmeyen izinler: ${perms}`);

process.exit(bad ? 1 : 0);
