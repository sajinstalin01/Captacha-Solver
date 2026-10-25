const $ = id => document.getElementById(id);

function render(report) {
  $("status").textContent = report?.error ? "Scan unavailable" : "Scan complete";
  $("host").textContent = report?.origin || report?.url || "Open a normal HTTP or HTTPS page.";
  $("count").textContent = report?.currentCount ?? 0;
  $("total").textContent = report?.items?.length ?? 0;
  const list = $("results");
  list.replaceChildren();
  const items = report?.items || [];
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = report?.error || "No CAPTCHA-like widgets detected. Detection is heuristic.";
    list.append(li);
    return;
  }
  for (const item of items.slice(0, 8)) {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "result-type";
    title.textContent = item.type || "Unknown";
    const note = document.createElement("div");
    note.className = "result-note";
    note.textContent = item.note || item.label || "Detected";
    li.append(title, note);
    list.append(li);
  }
}

$("scan").addEventListener("click", async () => {
  $("scan").disabled = true;
  $("status").textContent = "Scanning…";
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      render({error:"Browser internal pages cannot be scanned."});
      return;
    }
    render(await chrome.tabs.sendMessage(tab.id, {type:"RCL_SCAN"}));
  } catch (_) {
    render({error:"Reload the page and try again. Some browser pages block extensions."});
  } finally {
    $("scan").disabled = false;
  }
});

(async () => {
  const stored = await chrome.storage.local.get("rcl_last_scan").catch(() => ({}));
  if (stored.rcl_last_scan) render(stored.rcl_last_scan);
})();