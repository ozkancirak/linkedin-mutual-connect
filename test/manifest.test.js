// Manifest'in temel sağlamlığı: `node --test`
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));

test("manifest: Manifest V3 ve sürüm biçimi", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
});

test("manifest: içerik betikleri sadece LinkedIn'de çalışır", () => {
  for (const c of manifest.content_scripts || []) assert.deepEqual(c.matches, ["https://www.linkedin.com/*"]);
});
