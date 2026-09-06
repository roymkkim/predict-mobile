import { setRegion } from "@/lib/sim/regionStore";
import { setHomeSocialStyle } from "@/lib/sim/homeSocialStyleStore";
import { setMarketRulesStyle } from "@/lib/sim/marketRulesStore";
import { setSocialUx } from "@/lib/sim/socialUxStore";
import { setSwipeToBuy } from "@/lib/sim/swipeToBuyStore";
import { setCombinationsVisible } from "@/lib/sim/combinationsStore";

/** Query param that turns the web app into a looping slide demo. */
export const SLIDES_PARAM = "slides";

export const SLIDES_KINDS = [
  "home",
  "feed",
  "chat",
  "tape",
  "share",
  "orders",
  "swipe",
  "combo",
  "combo-sport",
  "combo-swipe",
] as const;

export type SlidesKind = (typeof SLIDES_KINDS)[number];

export function getSlidesKind(search = typeof window === "undefined" ? "" : window.location.search): SlidesKind | null {
  const raw = new URLSearchParams(search.startsWith("?") || search.length === 0 ? search : `?${search}`).get(SLIDES_PARAM);
  return (SLIDES_KINDS as readonly string[]).includes(raw ?? "") ? (raw as SlidesKind) : null;
}

/** Market-page tab the social slides should open on. */
export function slidesMarketTab(kind = getSlidesKind()): "social" | "chat" | "live" | null {
  if (kind === "feed") return "social";
  if (kind === "chat") return "chat";
  if (kind === "tape") return "live";
  return null;
}

export function armSlidesFlags(): void {
  // Kalshi MVP home has no social ticker. Slides always show the Polymarket feed.
  setRegion("polymarket");
  setSocialUx(true);
  setHomeSocialStyle("ticker");
  setSwipeToBuy(true);
  setCombinationsVisible(true);
  // First-visit event page is About tab; social slides need Markets banner tabs.
  if (slidesMarketTab()) setMarketRulesStyle("banner");
}

if (typeof window !== "undefined" && getSlidesKind()) armSlidesFlags();
