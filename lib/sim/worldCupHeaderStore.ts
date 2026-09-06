import { useSyncExternalStore } from "react";

// The World Cup header styles, toggled from the home display-settings sheet but
// rendered on the standalone World Cup page:
// - "compact": a minimal centered-title nav bar ("World Cup"); tapping the title
//   expands it into the full-bleed "banner" hero in place.
// - "lg": big left-aligned text title ("World Cup 2026" / "Round 32")
// - "banner": full-bleed hero image with the title baked into the artwork
// - "hero": the image as a rounded hero card with an overlaid back button
export type WorldCupHeaderVariant = "compact" | "lg" | "banner" | "hero";

// App-wide shared store. The home screen owns the toggle, but the value is read
// on the standalone World Cup page (which has its own local FeedSettings), so it
// lives in a tiny module-level store both screens subscribe to. "banner" (the
// full-bleed scroll-collapsing hero) is the default so the banner is visible on
// open. A full app reload (the demo "r" reset on web) restores this default.
let current: WorldCupHeaderVariant = "banner";
const listeners = new Set<() => void>();

export function setWorldCupHeader(next: WorldCupHeaderVariant) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useWorldCupHeader(): WorldCupHeaderVariant {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
