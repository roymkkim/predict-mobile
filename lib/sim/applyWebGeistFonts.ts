import { Platform } from "react-native";

import { geist } from "@/lib/sim/geistFonts";
import { getTypeface } from "@/lib/sim/typefaceStore";

// RN Text uses Expo names (Geist_600SemiBold). DS Text uses Geist-Regular.
// On web, rewrite Expo names to the DS family that actually loaded, with a
// sans-serif stack so Times is never the fallback.
const WEB_STACK: Record<string, string> = {
  Geist_400Regular: geist.regular,
  Geist_500Medium: geist.medium,
  Geist_600SemiBold: geist.semibold,
  Geist_700Bold: geist.bold,
};

function rewriteFamilyValue(value: string): string | null {
  const first = value.split(",")[0]?.replace(/['"]/g, "").trim();
  if (!first) return null;
  if (first === "Oswald" || first.startsWith("Oswald") || first === "Inter") return null;
  if (getTypeface() === "future") return null;
  const next = WEB_STACK[first];
  if (!next || value === next) return null;
  return next;
}

function rewriteNode(el: HTMLElement) {
  if (el.dataset.predictionsTitle === "true") return;
  const inline = rewriteFamilyValue(el.style.fontFamily || "");
  if (inline) {
    el.style.setProperty("font-family", inline, "important");
    return;
  }
  const computed = rewriteFamilyValue(getComputedStyle(el).fontFamily || "");
  if (computed) {
    el.style.setProperty("font-family", computed, "important");
  }
}

function walk(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("*").forEach(rewriteNode);
}

function rewriteStyleSheet(sheet: CSSStyleSheet) {
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return;
  }
  for (const rule of Array.from(rules)) {
    if (!(rule instanceof CSSStyleRule)) continue;
    const next = rewriteFamilyValue(rule.style.fontFamily || "");
    if (next) rule.style.setProperty("font-family", next, "important");
  }
}

function rewriteAllStyleSheets() {
  for (const sheet of Array.from(document.styleSheets)) {
    rewriteStyleSheet(sheet);
  }
}

function patchInsertRule() {
  const proto = CSSStyleSheet.prototype;
  if ((proto.insertRule as { __geist?: boolean }).__geist) return;
  const original = proto.insertRule;
  function patched(this: CSSStyleSheet, rule: string, index?: number) {
    const rewritten = rule.replace(
      /font-family\s*:\s*([^;}+]+)/gi,
      (full, value: string) => {
        const next = rewriteFamilyValue(value);
        return next ? `font-family: ${next}` : full;
      },
    );
    return original.call(this, rewritten, index);
  }
  (patched as { __geist?: boolean }).__geist = true;
  proto.insertRule = patched;
}

export function applyWebGeistFonts() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  if (!document.getElementById("future-type-faces")) {
    const future = document.createElement("link");
    future.id = "future-type-faces";
    future.rel = "stylesheet";
    future.href = "/fonts/future-type.css";
    document.head.appendChild(future);
  }

  document.documentElement.dataset.typeface = getTypeface();

  if (!document.getElementById("geist-faces")) {
    const link = document.createElement("link");
    link.id = "geist-faces";
    link.rel = "stylesheet";
    link.href = "/fonts/geist.css";
    document.head.appendChild(link);
  }

  if (!document.getElementById("mm-input-focus")) {
    const style = document.createElement("style");
    style.id = "mm-input-focus";
    style.textContent = `
      html, body, #root {
        overflow-x: hidden !important;
      }
      input, textarea {
        outline: none !important;
        box-shadow: none !important;
        -webkit-appearance: none;
      }
      input:focus, textarea:focus, input:focus-visible, textarea:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  patchInsertRule();
  rewriteAllStyleSheets();
  walk(document);

  const observer = new MutationObserver((mutations) => {
    rewriteAllStyleSheets();
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
        rewriteNode(mutation.target);
      }
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          rewriteNode(node);
          walk(node);
        }
      });
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
}

export function applyWebTypeface(mode: "current" | "future") {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.documentElement.dataset.typeface = mode;
}
