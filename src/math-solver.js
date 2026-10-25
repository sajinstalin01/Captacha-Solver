/* Rolex CAPTCHA Lab — arithmetic parser for synthetic/authorized test fixtures.
 * Does not use eval, access provider tokens, submit forms, or run automatically.
 */
(() => {
  "use strict";

  function normalize(input) {
    return String(input ?? "")
      .replace(/[−–—]/g, "-")
      .replace(/[×✕✖]/g, "*")
      .replace(/[÷／]/g, "/")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parse(input) {
    const text = normalize(input);
    // Accept a simple two-operand arithmetic expression, optionally followed by = ?.
    const match = text.match(/^(-?\d+(?:\.\d+)?)\s*([+*/-])\s*(-?\d+(?:\.\d+)?)\s*(?:=\s*\??)?$/);
    if (!match) return { ok: false, error: "Unsupported expression. Use two numbers and +, −, ×, or ÷." };

    const a = Number(match[1]);
    const operator = match[2];
    const b = Number(match[3]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { ok: false, error: "Numbers must be finite." };
    }

    let answer;
    switch (operator) {
      case "+": answer = a + b; break;
      case "-": answer = a - b; break;
      case "*": answer = a * b; break;
      case "/":
        if (b === 0) return { ok: false, error: "Division by zero is undefined." };
        answer = a / b;
        break;
      default: return { ok: false, error: "Unsupported operator." };
    }
    if (!Number.isFinite(answer)) return { ok: false, error: "Result is outside the supported numeric range." };
    return { ok: true, expression: text, answer: Number(answer.toPrecision(12)) };
  }

  // Expose a tiny API for local fixtures and authorized test pages only.
  Object.defineProperty(globalThis, "RCLMathCaptcha", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({ parse })
  });
})();
