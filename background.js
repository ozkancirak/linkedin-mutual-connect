// Arka plan: sayfadaki betik zamanlayıcıyla sekme açamaz (tarayıcı açılır pencere engeli sayar), sekmeyi burası açar ve kapatır.
// Sadece eklentinin kendi betiğinden gelen iki mesaja cevap verir.
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.type === "openProfile" && /^https:\/\/www\.linkedin\.com\//.test(msg.url || "")) {
    // Ön planda açılır: arka plan sekmelerinde zamanlayıcılar yavaşladığı için otomatik tıklama çok gecikirdi.
    // openerTabId sayesinde kapanınca odak yine ana sekmeye döner.
    chrome.tabs.create({ url: msg.url, active: true, openerTabId: sender.tab?.id }).then((tab) => reply({ tabId: tab.id }), () => reply(null));
    return true; // cevap asenkron
  }
  if (msg?.type === "closeTab") {
    const id = msg.tabId ?? sender.tab?.id;
    if (id != null) chrome.tabs.remove(id).catch(() => {});
    reply({});
  }
});
