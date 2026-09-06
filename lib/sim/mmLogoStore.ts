// MetaMask wordmark next to the chart period pills. Shown by default and
// toggled from Settings. Module-level store + useSyncExternalStore,
// same pattern as latestPlayStore.
import { useSyncExternalStore } from "react";

let shown = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setMmLogo(v: boolean) {
  shown = v;
  listeners.forEach((l) => l());
}

export function useMmLogo(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => shown,
    () => shown,
  );
}
