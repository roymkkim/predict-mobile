// Home layout variant (UXR): the classic mixed scrolling feed, or the pill
// filter home — a sticky Live/Crypto/Politics/Sports pill row that swaps the
// content below in place. Module-level store + useSyncExternalStore, same
// pattern as categoryTileStore.
import { useSyncExternalStore } from "react";

export type HomeLayout = "feed" | "pills";

let layout: HomeLayout = "feed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHomeLayout(): HomeLayout {
  return layout;
}

export function setHomeLayout(next: HomeLayout): void {
  if (next === layout) return;
  layout = next;
  listeners.forEach((l) => l());
}

export function useHomeLayout(): HomeLayout {
  return useSyncExternalStore(subscribe, getHomeLayout, getHomeLayout);
}
