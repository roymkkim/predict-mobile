// Category-tile settings for the UXR "Categories" row, two independent axes:
//   - visualization: how tile icons render
//       "material"     — Material icon glyphs
//       "illustration" — the 3D-render image assets (UXR_ICONS)
//   - count: how many tiles show
//       "many"  (">3") — full swipeable carousel of categories
//       "three" ("3")  — three fixed buttons: Crypto / Politics / Sports
// Module-level stores + useSyncExternalStore, same pattern as spreadVariantStore.
import { useSyncExternalStore } from "react";

export type CategoryTileStyle = "material" | "illustration";
export type CategoryTileCount = "many" | "three";

let style: CategoryTileStyle = "material";
let count: CategoryTileCount = "three";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCategoryTileStyle(): CategoryTileStyle {
  return style;
}

export function setCategoryTileStyle(next: CategoryTileStyle): void {
  if (next === style) return;
  style = next;
  listeners.forEach((l) => l());
}

export function useCategoryTileStyle(): CategoryTileStyle {
  return useSyncExternalStore(subscribe, getCategoryTileStyle, getCategoryTileStyle);
}

export function getCategoryTileCount(): CategoryTileCount {
  return count;
}

export function setCategoryTileCount(next: CategoryTileCount): void {
  if (next === count) return;
  count = next;
  listeners.forEach((l) => l());
}

export function useCategoryTileCount(): CategoryTileCount {
  return useSyncExternalStore(subscribe, getCategoryTileCount, getCategoryTileCount);
}

// Sports hub carousel variant: sport category tiles (default), mixed sport +
// league tiles, or league tiles (NFL / NBA / Premier League ... directly in
// the rail).
export type SportsRailVariant = "sports" | "leagues" | "mix";

let railVariant: SportsRailVariant = "sports";

export function getSportsRailVariant(): SportsRailVariant {
  return railVariant;
}

export function setSportsRailVariant(next: SportsRailVariant): void {
  if (next === railVariant) return;
  railVariant = next;
  listeners.forEach((l) => l());
}

export function useSportsRailVariant(): SportsRailVariant {
  return useSyncExternalStore(subscribe, getSportsRailVariant, getSportsRailVariant);
}

// Sports rail selection treatment: the original selected tile background ("pill"),
// a 48px tab underline, or a compact icon + label horizontal pill.
export type SportsRailStyle = "pill" | "tabs" | "horizontal";

let railStyle: SportsRailStyle = "pill";

export function getSportsRailStyle(): SportsRailStyle {
  return railStyle;
}

export function setSportsRailStyle(next: SportsRailStyle): void {
  if (next === railStyle) return;
  railStyle = next;
  listeners.forEach((l) => l());
}

export function useSportsRailStyle(): SportsRailStyle {
  return useSyncExternalStore(subscribe, getSportsRailStyle, getSportsRailStyle);
}
