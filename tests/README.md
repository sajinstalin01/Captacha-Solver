# Detector regression tests

Use local fixtures and sites you own or are authorized to test.

1. Load the unpacked extension in Chrome, Edge, or Brave.
2. Open a local HTML fixture containing an iframe URL with `recaptcha`, an element with `h-captcha`, and an element with `cf-turnstile` in its class.
3. Click the extension and choose **Scan current page**.
4. Confirm expected categories appear and every result is marked detection-only.
5. Add matching elements after page load and verify the MutationObserver triggers a new scan.

Regression cases:
- A page without CAPTCHA markup produces no findings.
- Known provider markers map to the expected category.
- Generic CAPTCHA labels map to the heuristic category.
- Repeated scans keep history bounded.
- Browser internal pages show a useful error.
- The extension sends no external network requests.

Detection uses page metadata and may have false positives or false negatives.