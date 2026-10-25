# Rolex CAPTCHA Lab

A cross-browser CAPTCHA **detection, classification, accessibility, and test harness** for Chrome, Edge, Brave, and Firefox.

## Safety boundary
This project identifies CAPTCHA-like widgets and reports their type. It does not defeat third-party anti-bot challenges, inject verification tokens, evade bot defenses, or submit automated answers to protected services. For third-party challenges, it guides the user to complete the provider's approved flow. Automated solving is reserved for synthetic fixtures and applications you own or are authorized to test.

## MVP features
- Manifest V3 browser extension foundation
- Heuristic detection for reCAPTCHA, hCaptcha, Cloudflare Turnstile, AWS WAF CAPTCHA, GeeTest, and generic image/text markers
- MutationObserver-based rescanning for dynamically inserted widgets
- Popup dashboard with current findings and bounded recent history
- Synthetic local fixture at `tests/fixture.html` for manual regression checks
- Privacy-first: no network requests, no image uploads, no tracking
- MIT license

## Install for development
1. Download or clone this repository.
2. Open `chrome://extensions`, `edge://extensions`, or `brave://extensions`.
3. Enable Developer mode and choose **Load unpacked**; select the repository folder.
4. For Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`.

## Test the MVP
1. Load the extension unpacked using the steps above.
2. Serve `tests/fixture.html` from a local HTTP server (for example, run `python -m http.server 8000` from the repository root).
3. Open `http://localhost:8000/tests/fixture.html` and scan it with the extension.
4. Click **Add dynamic synthetic marker** and scan again to test dynamically inserted markup.

## Limitations
Detection is heuristic and may produce false positives/negatives. The current MVP does not contain OCR or a trained AI solver, and it cannot reliably identify every provider or challenge. Browser APIs and store requirements vary; Firefox support should be validated in a real Firefox install before release. Third-party verification remains user/provider controlled.

## Roadmap
- Synthetic CAPTCHA playground for owned test pages
- Detection test fixtures and regression suite
- Accessibility helper for user-controlled completion
- Optional OCR evaluation against generated local fixtures only
- Exportable local detection reports

## License
MIT