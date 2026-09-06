import { useSyncExternalStore } from "react";

// Display → Try these → Social UX. On for the demo. Persist so a
// deploy/refresh keeps the user's last choice.
const STORAGE_KEY = "predict.social-ux";

let enabled = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: boolean) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "1") enabled = true;
    if (raw === "0") enabled = false;
  } catch {
    /* keep default */
  }
}

export function setSocialUx(next: boolean) {
  if (next === enabled) return;
  enabled = next;
  persist(next);
  emit();
}

export function getSocialUx(): boolean {
  return enabled;
}

export function useSocialUx(): boolean {
  return useSyncExternalStore(subscribe, getSocialUx, getSocialUx);
}
