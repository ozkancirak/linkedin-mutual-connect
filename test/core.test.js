// Bağımlılıksız birim testleri: `node --test`
// src/core.js sayfaya dokunmadan yüklenebilen saf fonksiyonlar içerir; burada onları sanal bir ortamda çalıştırıyoruz.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const src = fs.readFileSync(path.join(__dirname, "..", "src", "core.js"), "utf8");
// Üst düzey `const`lar sanal ortamın global nesnesine yazılmaz, o yüzden sonda bir ifadeyle dışarı veriyoruz.
const { CONNECT, isConnect } = vm.runInNewContext(src + "\n;({ CONNECT, isConnect })", {});

// Bir DOM düğmesini taklit eder: etiketi (aria-label) ve görünen yazısı
const btn = (aria, text) => ({ getAttribute: () => aria, innerText: text });

test("CONNECT: Bağlan butonunu tanır", () => {
  assert.ok(CONNECT.test("Invite Hakan Gençoğlu to connect"));
  assert.ok(CONNECT.test("Connect"));
  assert.ok(CONNECT.test("Bağlantı kur"));
  assert.ok(CONNECT.test("Hakan adlı kullanıcıyı bağlantı kurmaya davet et"));
});

test("isConnect: etiket ya da görünen yazıdan biri yeter", () => {
  // Türkçede etiket genel olabilir, görünen yazı "Bağlantı kur"
  assert.ok(isConnect(btn("Hakan adlı kullanıcıya davet gönder", "Bağlantı kur")));
  assert.ok(isConnect(btn("Invite Eda to connect", "")));
  assert.ok(isConnect(btn("", "Connect")));
});

test("isConnect: diğer butonları tanımaz", () => {
  assert.ok(!isConnect(btn("", "Mesaj")));
  assert.ok(!isConnect(btn("", "Pending")));
  assert.ok(!isConnect(btn("", "Beklemede")));
  assert.ok(!isConnect(btn("Beklemede", "Gönderildi")));
  assert.ok(!isConnect(btn("", "Bağlantılar"))); // menü bağlantısı, "bağlantı kur" değil
  assert.ok(!isConnect(btn("", "Not olmadan gönder")));
});
