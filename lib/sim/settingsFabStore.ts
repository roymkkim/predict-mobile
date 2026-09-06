// Global "open the predictions settings" request channel. The retro-Mac FAB
// is mounted at the app root (visible on every page), but the SettingsSheet
// and all its state live on the home screen — so the FAB bumps a counter here
// and navigates home; the home screen watches the counter and opens the sheet.
// A route can be retained so a context-sensitive setting can return the user
// to the page they were viewing after the change.
import { useSyncExternalStore } from "react";

let counter = 0;
let returnPath: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function get(): number {
  return counter;
}

export function requestOpenSettings(path?: string): void {
  returnPath = path ?? null;
  counter++;
  listeners.forEach((l) => l());
}

export function consumeSettingsReturnPath(): string | null {
  const path = returnPath;
  returnPath = null;
  return path;
}

export function getSettingsReturnPath(): string | null {
  return returnPath;
}

export function useSettingsOpenRequest(): number {
  return useSyncExternalStore(subscribe, get, get);
}

const FAB_POS_KEY = "predict.settings-fab-pos";

export type SettingsFabPos = { x: number; y: number };

let fabPos: SettingsFabPos | null = null;
const fabListeners = new Set<() => void>();

function fabSubscribe(listener: () => void): () => void {
  fabListeners.add(listener);
  return () => fabListeners.delete(listener);
}

function parseFabPos(raw: string | null): SettingsFabPos | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SettingsFabPos>;
    if (typeof v.x !== "number" || typeof v.y !== "number" || !Number.isFinite(v.x) || !Number.isFinite(v.y)) {
      return null;
    }
    return { x: v.x, y: v.y };
  } catch {
    return null;
  }
}

function persistFabPos(next: SettingsFabPos): void {
  const json = JSON.stringify(next);
  try {
    globalThis.localStorage?.setItem(FAB_POS_KEY, json);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    fabPos = parseFabPos(globalThis.localStorage?.getItem(FAB_POS_KEY) ?? null);
  } catch {
    fabPos = null;
  }
}

export function getSettingsFabPos(): SettingsFabPos | null {
  return fabPos;
}

export function setSettingsFabPos(next: SettingsFabPos): void {
  fabPos = next;
  persistFabPos(next);
  fabListeners.forEach((l) => l());
}

export function useSettingsFabPos(): SettingsFabPos | null {
  return useSyncExternalStore(fabSubscribe, getSettingsFabPos, getSettingsFabPos);
}

const FAB_VISIBLE_KEY = "predict.settings-fab-visible-v2";

// Visible on first visit. ⌘S / Ctrl+S toggles it.
let fabVisible = true;
const visibleListeners = new Set<() => void>();

function visibleSubscribe(listener: () => void): () => void {
  visibleListeners.add(listener);
  return () => visibleListeners.delete(listener);
}

function persistFabVisible(next: boolean): void {
  try {
    globalThis.localStorage?.setItem(FAB_VISIBLE_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(FAB_VISIBLE_KEY);
    if (raw === "0") fabVisible = false;
    if (raw === "1") fabVisible = true;
  } catch {
    /* keep default */
  }
}

export function getSettingsFabVisible(): boolean {
  return fabVisible;
}

export function setSettingsFabVisible(next: boolean): void {
  if (next === fabVisible) return;
  fabVisible = next;
  persistFabVisible(next);
  visibleListeners.forEach((l) => l());
}

export function toggleSettingsFabVisible(): void {
  setSettingsFabVisible(!fabVisible);
}

export function useSettingsFabVisible(): boolean {
  return useSyncExternalStore(visibleSubscribe, getSettingsFabVisible, getSettingsFabVisible);
}
