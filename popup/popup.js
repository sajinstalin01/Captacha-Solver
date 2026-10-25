const $ = id => document.getElementById(id);

function render(report) {
  $("status").textContent = report?.error ? "Scan unavailable" : "Live scan complete";
  $("host").textContent = report?.origin || report?.url || "Open a normal HTTP or HTTPS page.";
  $("count").textContent = report?.currentCount ?? 0;
  $("total").textContent = report?.history?.length ?? report?.items?.length ?? 0;
  const list = $("results");
  list.replaceChildren();
  const items = report?.items || [];
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = report?.error || "No CAPTCHA-like widgets detected in the current scan.";
    list.append(li);
    return;
  }
  for (const item of items.slice(0, 10)) {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "result-type";
    title.textContent = item.type || "Unknown challenge";
    const note = document.createElement("div");
    note.className = "result-note";
    note.textContent = `${String(item.confidence || "unknown").toUpperCase()} confidence · ${item.evidence || item.note || item.label || "Heuristic detection"}`;
    li.append(title, note);
    list.append(li);
  }
}

async function scanActiveTab() {
  $("scan").disabled = true;
  $("status").textContent = "Scanning current tab…";
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      render({error:"Browser internal pages cannot be scanned."});
      return;
    }
    const report = await chrome.tabs.sendMessage(tab.id, {type:"RCL_SCAN"});
    render(report);
  } catch (_) {
    render({error:"Could not reach the page scanner. Reload the website and reopen the extension."});
  } finally {
    $("scan").disabled = false;
  }
}

$("scan").addEventListener("click", scanActiveTab);

// Run a fresh scan whenever the popup opens; do not rely on another tab's
// last stored report, since extension storage is shared across tabs.
scanActiveTab();