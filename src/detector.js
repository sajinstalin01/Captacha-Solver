(() => {
  "use strict";
  const KEY = "rcl_last_scan";
  const MAX_RESULTS = 30;
  let timer = 0;
  let scanRunning = false;
  let scanAgain = false;

  // Evidence is scored instead of stopping at the first generic keyword.
  // This improves provider identification while keeping results heuristic.
  const RULES = [
    { type: "reCAPTCHA", strong: [/google\.com\/recaptcha/i, /g-recaptcha/i, /recaptcha\/api/i, /grecaptcha/i] },
    { type: "hCaptcha", strong: [/hcaptcha\.com/i, /h-captcha/i, /data-hcaptcha/i, /hcaptcha/i] },
    { type: "Cloudflare Turnstile", strong: [/challenges\.cloudflare\.com\/turnstile/i, /cf-turnstile/i, /cf_chl_captcha/i] },
    { type: "AWS WAF CAPTCHA", strong: [/captcha\.awswaf\.com/i, /aws-waf/i, /awswaf/i] },
    { type: "GeeTest", strong: [/geetest/i, /gt_captcha/i, /geetest4/i] },
    { type: "Arkose Labs / FunCaptcha", strong: [/arkoselabs/i, /funcaptcha/i, /arkose/i] },
    { type: "KeyCAPTCHA", strong: [/keycaptcha/i] },
    { type: "Friendly Captcha", strong: [/friendlycaptcha/i, /frc-captcha/i] },
    { type: "Audio CAPTCHA (heuristic)", strong: [/audio.?captcha/i, /captcha.*audio/i, /audio challenge/i] },
    { type: "Image/Text CAPTCHA (heuristic)", generic: [/captcha/i, /verification code/i, /security code/i, /enter the characters/i, /prove you are human/i] }
  ];
  const CANDIDATE_SELECTOR = [
    "iframe", "img", "canvas", "input", "button",
    "[class*='captcha' i]", "[id*='captcha' i]", "[data-sitekey]",
    "[aria-label*='verification' i]", "[title*='captcha' i]",
    "[class*='challenge' i]", "[id*='challenge' i]",
    "[class*='turnstile' i]", "[class*='geetest' i]",
    "[class*='h-captcha' i]", "[class*='recaptcha' i]"
  ].join(",");

  function elementText(el) {
    let text = "";
    try {
      if (el.children.length < 3) text = (el.textContent || "").slice(0, 180);
    } catch (_) {}
    return text;
  }

  function describe(el) {
    const attrs = ["id", "class", "src", "title", "aria-label", "name", "alt",
      "placeholder", "data-sitekey", "role", "type", "href"];
    const values = attrs.map(name => {
      try { return el.getAttribute(name) || ""; } catch (_) { return ""; }
    });
    let label = "";
    try {
      if (el.labels) label = Array.from(el.labels).map(x => x.textContent || "").join(" ");
    } catch (_) {}
    return [el.tagName || "", ...values, label, elementText(el)].join(" ").slice(0, 1400);
  }

  function classify(el, value) {
    const evidence = value || describe(el);
    for (const rule of RULES) {
      if (rule.strong?.some(re => re.test(evidence))) {
        return { type: rule.type, confidence: "high", evidence: "Provider-specific DOM marker" };
      }
    }
    for (const rule of RULES) {
      if (rule.generic?.some(re => re.test(evidence))) {
        return { type: rule.type, confidence: "medium", evidence: "Generic CAPTCHA-related text or attribute" };
      }
    }
    // A challenge container without a known provider is a weak signal.
    if (/challenge/i.test(evidence) && /(verify|human|security|robot|captcha)/i.test(evidence)) {
      return { type: "Unknown challenge (heuristic)", confidence: "low", evidence: "Challenge-related markup and verification wording" };
    }
    return null;
  }

  function collectCandidates(root, output) {
    try {
      root.querySelectorAll(CANDIDATE_SELECTOR).forEach(el => output.add(el));
      // Inspect open shadow roots only; closed roots and cross-origin frame DOMs
      // are intentionally inaccessible to extensions.
      root.querySelectorAll("*").forEach(el => {
        if (el.shadowRoot) collectCandidates(el.shadowRoot, output);
      });
    } catch (_) {}
  }

  async function scan() {
    if (scanRunning) {
      scanAgain = true;
      return { error: "Scan queued" };
    }
    scanRunning = true;
    try {
      const candidates = new Set();
      collectCandidates(document, candidates);
      const current = [];
      const fingerprints = new Set();

      for (const el of candidates) {
        const value = describe(el);
        const match = classify(el, value);
        if (!match) continue;
        const fingerprint = match.type + "|" + value;
        if (fingerprints.has(fingerprint)) continue;
        fingerprints.add(fingerprint);
        const label = (el.getAttribute("aria-label") || el.getAttribute("title") ||
          el.getAttribute("alt") || el.id || match.type).trim().slice(0, 100);
        current.push({
          type: match.type,
          confidence: match.confidence,
          evidence: match.evidence,
          tag: (el.tagName || "unknown").toLowerCase(),
          label,
          note: "Detection only. Third-party verification remains user/provider controlled.",
          detectedAt: new Date().toISOString()
        });
        if (current.length >= MAX_RESULTS) break;
      }

      // Keep current-page results separate from recent historical findings.
      let previous = {};
      try { previous = await chrome.storage.local.get(KEY); } catch (_) {}
      const oldReport = previous[KEY] || {};
      const history = Array.isArray(oldReport.history) ? oldReport.history : [];
      const stamped = current.map(item => ({ ...item, origin: location.origin }));
      const report = {
        origin: location.origin,
        pageTitle: document.title.slice(0, 160),
        scannedAt: new Date().toISOString(),
        currentCount: current.length,
        items: current,
        history: [...stamped, ...history].slice(0, MAX_RESULTS)
      };
      try { await chrome.storage.local.set({ [KEY]: report }); } catch (_) {}
      return report;
    } finally {
      scanRunning = false;
      if (scanAgain) {
        scanAgain = false;
        clearTimeout(timer);
        timer = setTimeout(() => { scan(); }, 100);
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "RCL_SCAN") return;
    scan().then(sendResponse).catch(() => sendResponse({ error: "Scan failed" }));
    return true;
  });

  try {
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { scan().catch(() => {}); }, 350);
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    scan().catch(() => {});
  } catch (_) {}
})();