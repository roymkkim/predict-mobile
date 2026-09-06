import { useEffect } from "react";
import { Platform } from "react-native";

import { armSlidesFlags, getSlidesKind, type SlidesKind } from "@/lib/sim/slidesDemo";

const START_KEY = "predict.slides-start";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 8 && r.height > 8;
}

function findByText(match: string | RegExp, exact = false): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll("div,span,button,a,p,h1,h2,h3,input,textarea")) as HTMLElement[];
  let best: HTMLElement | null = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    if (!visible(node)) continue;
    const text = (node.textContent ?? "").trim();
    const ok =
      typeof match === "string"
        ? exact
          ? text === match
          : text.includes(match)
        : match.test(text);
    if (!ok) continue;
    const r = node.getBoundingClientRect();
    const area = r.width * r.height;
    if (area < bestArea && area < 80_000) {
      best = node;
      bestArea = area;
    }
  }
  return best;
}

async function waitFor(match: string | RegExp, timeout = 16000, exact = false): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const node = findByText(match, exact);
    if (node) return node;
    await sleep(120);
  }
  return null;
}

function reveal(el: Element | null): void {
  if (!el) return;
  const target = el instanceof HTMLElement ? el : el.parentElement;
  if (!target) return;
  let p: HTMLElement | null = target;
  while (p) {
    const oy = window.getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && p.scrollHeight > p.clientHeight + 2) {
      const pr = p.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      p.scrollTop += tr.top - pr.top - 8;
    }
    p = p.parentElement;
  }
}

async function waitId(id: string, timeout = 16000): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const node = document.getElementById(id);
    if (node && visible(node)) return node;
    await sleep(120);
  }
  return null;
}

function tap(match: string | RegExp, exact = false): boolean {
  const node = findByText(match, exact);
  if (!node) return false;
  node.click();
  return true;
}

async function swipeToBuy(): Promise<boolean> {
  const label = await waitFor(/Swipe to buy/i);
  if (!label) return false;
  let node: HTMLElement | null = label;
  for (let i = 0; i < 10 && node; i++) {
    const r = node.getBoundingClientRect();
    if (r.width > 220 && r.height >= 44 && r.height <= 80) {
      const y = r.y + r.height / 2;
      const from = r.x + 24;
      const to = r.x + r.width - 16;
      node.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, button: 0, clientX: from, pageX: from, clientY: y, pageY: y }),
      );
      const steps = 18;
      for (let s = 1; s <= steps; s++) {
        const x = from + ((to - from) * s) / steps;
        await sleep(14);
        window.dispatchEvent(
          new PointerEvent("pointermove", { bubbles: true, pointerId: 1, clientX: x, pageX: x, clientY: y, pageY: y }),
        );
      }
      await sleep(500);
      window.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, pointerId: 1, button: 0, clientX: to, pageX: to, clientY: y, pageY: y }),
      );
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function typeInto(placeholder: string, value: string): boolean {
  const field = document.querySelector(`[placeholder="${placeholder}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!field) return false;
  field.focus();
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set;
  setter?.call(field, value);
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function tapAria(label: string): boolean {
  const el = document.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
  if (!el || !visible(el)) return false;
  el.click();
  return true;
}

function hideChrome(): void {
  const sheet = document.createElement("style");
  sheet.textContent = `
    [aria-label="Settings"]{display:none!important}
    html, body, #root, #root * { outline: none !important; -webkit-tap-highlight-color: transparent; }
    *:focus, *:focus-visible, *:active { outline: none !important; }
  `;
  document.documentElement.appendChild(sheet);
}

function restart(): void {
  const start = sessionStorage.getItem(START_KEY);
  if (start) window.location.replace(start);
  else window.location.reload();
}

async function run(kind: SlidesKind, live: () => boolean): Promise<void> {
  const step = async (ms: number) => {
    await sleep(ms);
    return live();
  };

  if (kind === "home") {
    const el = (await waitId("what-people-are-saying")) ?? (await waitFor("What people are saying"));
    if (!el) return;
    reveal(el);
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "feed") {
    const el = (await waitId("slides-social-feed")) ?? (await waitFor("Copy trade"));
    if (!el) return;
    reveal(el);
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "chat") {
    const el = (await waitId("slides-live-chat")) ?? (await waitFor("Say something"));
    if (!el) return;
    reveal(el);
    if (!(await step(1800))) return;
    typeInto("Say something", "lets go");
    tapAria("Send");
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "tape") {
    const el = (await waitId("slides-live-tape")) ?? (await waitFor("Live trade"));
    if (!el) return;
    reveal(el);
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "share") {
    if (!(await waitFor("Trade submitted!"))) return;
    if (!(await waitFor("Share trade"))) return;
    if (!(await step(900))) return;
    tap("Share trade", true);
    const composer = (await waitId("slides-share-composer")) ?? (await waitFor("Share post"));
    if (!composer) return;
    reveal(composer);
    typeInto("Share your thoughts", "called it");
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "orders" || kind === "swipe") {
    if (!(await waitFor(/Yes ·/))) return;
    if (!(await step(700))) return;
    tap(/Yes ·/);
    if (!(await waitFor("Pay with"))) return;
    if (kind === "orders") {
      if (!(await step(1100))) return;
      tapAria("Order type");
      await waitFor("Limit price");
      if (!(await step(2800))) return;
      restart();
      return;
    }
    tap("$20", true);
    if (!(await step(350))) return;
    await swipeToBuy();
    await waitFor("Trade submitted!");
    if (!(await step(2200))) return;
    restart();
    return;
  }

  if (kind === "combo") {
    if (!(await waitFor("Combos"))) return;
    if (!(await waitFor("Picks"))) return;
    if (!(await waitFor("MMA"))) return;
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "combo-sport") {
    if (!(await waitFor("Build a Combo"))) return;
    if (!(await step(1800))) return;
    tap("Build a Combo", true);
    if (!(await step(16000))) return;
    restart();
    return;
  }

  if (kind === "combo-swipe") {
    if (!(await waitFor("Combos"))) return;
    let addBtn: HTMLElement | null = null;
    for (let i = 0; i < 80; i++) {
      const el = document.querySelector('[aria-label*="pays"]');
      if (el instanceof HTMLElement && visible(el)) {
        addBtn = el;
        break;
      }
      await sleep(120);
    }
    if (!addBtn) return;
    addBtn.scrollIntoView({ block: "center" });
    if (!(await step(400))) return;
    addBtn.click();
    if (!(await waitFor("Next", 8000, true))) return;
    if (!(await step(700))) return;
    tap("Next", true);
    if (!(await waitFor(/Swipe to buy/i))) return;
    if (!(await step(500))) return;
    await swipeToBuy();
    await waitFor("Trade submitted!");
    if (!(await step(2200))) return;
    restart();
    return;
  }
}

export function SlidesDemo() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const kind = getSlidesKind();
    if (!kind) return;
    armSlidesFlags();
    hideChrome();
    try {
      sessionStorage.setItem(START_KEY, window.location.href);
    } catch {
      /* session-only */
    }
    let live = true;
    void run(kind, () => live);
    return () => {
      live = false;
    };
  }, []);

  return null;
}
