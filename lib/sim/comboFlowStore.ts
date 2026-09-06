import { useEffect, useSyncExternalStore } from "react";
import { useLocalSearchParams, usePathname } from "expo-router";
import { comboFlowReconcile, comboPageUnselectedChrome, isComboCapablePath } from "./comboAffordance";
import { closeComboCartSlip } from "./comboAffordanceStore";
import { useCombinationsVisible } from "./combinationsStore";

/** Live is a directory of live markets — leftover Sports combo flow must not restyle it. */
export function isLiveRoute(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/live";
}

let flow = false;
/** Header ComboMark should fade out; sheet stays until `exitComboFlow`. */
let chromeExiting = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function enterComboFlow(): void {
  if (flow && !chromeExiting) return;
  flow = true;
  chromeExiting = false;
  emit();
}

/** Start header ComboMark exit in parallel with ComboSheet dismiss. */
export function beginExitComboFlow(): void {
  if (!flow || chromeExiting) return;
  chromeExiting = true;
  emit();
}

export function exitComboFlow(): void {
  flow = false;
  chromeExiting = true;
  closeComboCartSlip();
  emit();
}

export function getComboFlow(): boolean {
  return flow;
}

export function getComboChromeExiting(): boolean {
  return chromeExiting;
}

export function useComboFlow(): boolean {
  return useSyncExternalStore(subscribe, getComboFlow, getComboFlow);
}

export function useComboChromeExiting(): boolean {
  return useSyncExternalStore(subscribe, getComboChromeExiting, getComboChromeExiting);
}

export function withComboQuery(href: string): string {
  if (href.includes("combo=")) return href;
  return href.includes("?") ? `${href}&combo=1` : `${href}?combo=1`;
}

export function comboParamOn(combo: string | string[] | undefined): boolean {
  const raw = Array.isArray(combo) ? combo[0] : combo;
  return raw === "1" || raw === "true";
}

/** Combinations on and combo mode entered this session. Off-path pages never restyle. */
export function useComboMode(): boolean {
  const enabled = useCombinationsVisible();
  const flow = useComboFlow();
  const pathname = usePathname();
  const { combo, sports } = useLocalSearchParams<{ combo?: string; sports?: string }>();
  const fromQuery = comboParamOn(combo);
  const sportsFlag = Array.isArray(sports) ? sports[0] : sports;
  const capable = isComboCapablePath(pathname, sportsFlag);
  useEffect(() => {
    const action = comboFlowReconcile(capable, fromQuery);
    if (action === "enter" && enabled) enterComboFlow();
    if (action === "exit") exitComboFlow();
  }, [enabled, fromQuery, capable]);
  if (!capable) return false;
  return enabled && (flow || fromQuery);
}

/** Home / carousel pass `false` so leftover combo flow cannot restyle moneyline pills. */
export function useEffectiveCombo(combo?: boolean): boolean {
  const mode = useComboMode();
  if (combo === false) return false;
  if (combo === true) return true;
  return mode;
}

/** Outline chrome whenever combo mode is on, so nested cards inherit it even if search params drop. */
export function useComboPageUnselectedChrome(): "muted" | "outline" {
  const pathname = usePathname();
  const { sports } = useLocalSearchParams<{ sports?: string }>();
  const comboMode = useComboMode();
  if (comboMode) return "outline";
  return comboPageUnselectedChrome(pathname, Array.isArray(sports) ? sports[0] : sports);
}
