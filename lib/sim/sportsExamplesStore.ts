import { useSyncExternalStore } from "react";

// App-wide shared store for the "Sport examples" toggle. When on, the home feed
// Sports section is replaced with a curated one-of-each-sport demo set (NFL, NBA,
// Soccer, Golf, Tennis, F1) so every supported card layout is visible at a
// glance. Lives in a tiny module-level store (like tennisHiddenStore) rather
// than FeedSettings so only the home Feed needs to read it. Default on (shown);
// a full app reload clears it back to the default.
let current = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSportsExamples(v: boolean) {
  if (v === current) return;
  current = v;
  emit();
}

// Reactive read — components re-render when the flag changes.
export function useSportsExamples(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
