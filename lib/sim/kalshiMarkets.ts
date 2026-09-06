// Kalshi-listed sports for live + combo. Venue is `regionStore` ("kalshi"),
// independent of MVP vs V2 flavor. Polymarket keeps the full catalog.
import { getRegion, useRegion } from "@/lib/sim/regionStore";
import {
  COMBO_PREVIEWS,
  COMBO_PREVIEW_NCAAF,
  type ComboPreview,
} from "@/lib/sim/comboData";
import {
  COMBO_NAV_CHIPS,
  POPULAR_COMBO_LEAGUES,
  comboSportHref,
  type ComboNavChip,
  type PopularComboLeague,
} from "@/lib/sim/comboNav";

export const KALSHI_LEAGUE_IDS = ["NFL", "NCAAF", "NCAA Football"] as const;

export function isKalshiLeague(league: string | undefined | null): boolean {
  if (!league) return false;
  const name = league.trim();
  return name === "NFL" || name === "NCAAF" || name === "NCAA Football";
}

export function useKalshiVenue(): boolean {
  return useRegion() === "kalshi";
}

export function comboPreviewsForVenue(kalshi: boolean): ComboPreview[] {
  if (!kalshi) return COMBO_PREVIEWS;
  const proFootball = COMBO_PREVIEWS.find((p) => p.label === "Pro Football");
  return [proFootball, COMBO_PREVIEW_NCAAF].filter((p): p is ComboPreview => Boolean(p));
}

export function comboPreviewByLabel(label: string, kalshi: boolean = getRegion() === "kalshi"): ComboPreview | undefined {
  return comboPreviewsForVenue(kalshi).find((p) => p.label === label);
}

export function comboNavChipsForVenue(kalshi: boolean): ComboNavChip[] {
  if (!kalshi) return COMBO_NAV_CHIPS;
  return [
    { label: "NFL", href: comboSportHref("football", "NFL"), sportSlug: "football", league: "NFL" },
    { label: "NCAAF", href: comboSportHref("football", "NCAAF"), sportSlug: "football", league: "NCAA Football" },
  ];
}

export function comboSportTabsForVenue(kalshi: boolean): ComboNavChip[] {
  return comboNavChipsForVenue(kalshi).filter((chip) => Boolean(chip.sportSlug));
}

export function popularComboLeaguesForVenue(kalshi: boolean): PopularComboLeague[] {
  if (!kalshi) return POPULAR_COMBO_LEAGUES;
  return [
    { title: "NFL", sportSlug: "football", league: "NFL" },
    { title: "NCAAF", sportSlug: "football", league: "NCAAF" },
  ];
}
