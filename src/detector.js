(() => {
  "use strict";
  const KEY = "rcl_last_scan";
  const MAX_RESULTS = 30;
  const seen = new Set();

  const RULES = [
    ["reCAPTCHA", [/google\.com\/recaptcha/i, /g-recaptcha/i, /recaptcha\/api/i]],
    ["hCaptcha", [/hcaptcha\.com/i, /h-captcha/i, /data-hcaptcha/i]],
    ["Cloudflare Turnstile", [/challenges\.cloudflare\.com\/turnstile/i, /cf-turnstile/i]],
    ["AWS WAF CAPTCHA", [/captcha\.awswaf\.com/i, /aws-waf/i]],
    ["GeeTest", [/geetest/i, /gt_captcha/i]],
    ["Generic image/text CAPTCHA (heuristic)", [/captcha/i, /verification code/i, /security code/i, /enter the characters/i]]
  ];

  function describe(el) {
    const attrs = ["id", "class", "src", "title", "aria-label", "name", "alt", "placeholder", "data-sitekey"];
    let text = "";
    try { if (el.children.length < 2) text = (el.textContent || "").slice(0, 160); } catch (_) {}
    return [el.tagName, ...attrs.map(a => el.getAttribute?.(a) || ""), text].join(" ").slice(0, 1000);
  }

  function classify(el) {
    const value = describe(el);
    for (const [type, patterns] of RULES) {
      if (patterns.some(pattern => pattern.test(value))) return type;
    }
    return null;
  }

  async function scan() {
    const selectors = 'iframe, img, canvas, input, [class*="captcha" i], [id*="captcha" i], [data-sitekey], [aria-label*="verification" i]';
    const items = [];
    for (const el of document.querySelectorAll(selectors)) {
      const type = classify(el);
      if (!type) continue;
      const fingerprint = type + "|" + describe(el);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      items.push({
        type,
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("alt") || el.id || type).slice(0, 100),
        note: "Detection only. Complete third-party verification through its approved user flow.",
        detectedAt: new Date().toISOString()
      });
    }
    let previous = {};
    try { previous = await chrome.storage.local.get(KEY); } catch (_) {}
    const old = Array.isArray(previous[KEY]?.items) ? previous[KEY].items : [];
    const report = {
      origin: location.origin,
      pageTitle: document.title.slice(0, 160),
      scannedAt: new Date().toISOString(),
      currentCount: items.length,
      items: [...items, ...old].slice(0, MAX_RESULTS)
    };
    try { await chrome.storage.local.set({ [KEY]: report }); } catch (_) {}
    return report;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "RCL_SCAN") return;
    scan().then(sendResponse).catch(() => sendResponse({ error: "Scan failed" }));
    return true;
  });

  let timer;
  try {
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { scan(); }, 400);
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true });
    scan();
  } catch (_) {}
})();