import { useSyncExternalStore } from "react";

const STORAGE_KEY = "predict.team-abbreviations";

let enabled = false;
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

export function getTeamAbbrUnderLogos(): boolean {
  return enabled;
}

export function setTeamAbbrUnderLogos(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  persist(next);
  emit();
}

export function useTeamAbbrUnderLogos(): boolean {
  return useSyncExternalStore(subscribe, getTeamAbbrUnderLogos, getTeamAbbrUnderLogos);
}
