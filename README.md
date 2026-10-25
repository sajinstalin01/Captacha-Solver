# Rolex CAPTCHA Lab

A cross-browser CAPTCHA **detection, classification, accessibility, and test harness** for Chrome, Edge, Brave, and Firefox.

## Safety boundary
This project identifies CAPTCHA-like widgets and reports their type. It does not defeat third-party anti-bot challenges, inject verification tokens, evade bot defenses, or submit automated answers to protected services. For third-party challenges, it guides the user to complete the provider's approved flow. Automated solving is reserved for synthetic fixtures and applications you own or are authorized to test.

## MVP features
- Manifest V3 browser extension foundation
- Heuristic detection for reCAPTCHA, hCaptcha, Cloudflare Turnstile, image/text CAPTCHA, and unknown challenge widgets
- MutationObserver-based detection for dynamically loaded widgets
- Small popup dashboard with detected challenge counts and last scan
- Privacy-first: no network requests, no image uploads, no tracking
- Cross-browser packaging guidance

## Install for development
1. Download or clone this repository.
2. Open `chrome://extensions`, `edge://extensions`, or `brave://extensions`.
3. Enable Developer mode and choose **Load unpacked**; select the repository folder.
4. For Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`.

## Limitations
Browser stores and extension APIs vary. Firefox support may require a browser-specific manifest/build step as the project grows. Detection is heuristic and may produce false positives/negatives. This is a research MVP, not a universal solver.

## Roadmap
- Synthetic CAPTCHA playground for owned test pages
- Detection test fixtures and regression suite
- Accessibility helper for user-controlled completion
- Optional OCR evaluation against generated local fixtures only
- Exportable local detection reports

## License
MIT