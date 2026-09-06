export type ComboNavChip = {
  label: string;
  href: string;
  sportSlug?: string;
  league?: string;
};

// Category chips on /combination — navigation only, never a selected state.
export const COMBO_NAV_CHIPS: ComboNavChip[] = [
  { label: "Baseball", href: "/uxr-sport/baseball?combo=1", sportSlug: "baseball" },
  { label: "Soccer", href: "/uxr-sport/soccer?combo=1", sportSlug: "soccer" },
  { label: "Tennis", href: "/uxr-sport/tennis?combo=1", sportSlug: "tennis" },
  { label: "Basketball", href: "/uxr-sport/basketball?combo=1", sportSlug: "basketball" },
  { label: "Football", href: "/uxr-sport/football?combo=1", sportSlug: "football" },
  { label: "MMA", href: "/uxr-sport/mma?league=UFC&combo=1", sportSlug: "mma", league: "UFC" },
  { label: "PGA", href: "/uxr-sport/pga?combo=1", sportSlug: "pga" },
  { label: "E-sports", href: "/uxr-sport/esports?combo=1", sportSlug: "esports" },
  { label: "Crypto", href: "/crypto?combo=1" },
  { label: "Boxing", href: "/uxr-sport/boxing?league=Boxing&combo=1", sportSlug: "boxing", league: "Boxing" },
  { label: "Cricket", href: "/uxr-sport/cricket?combo=1", sportSlug: "cricket" },
  { label: "Racing", href: "/uxr-sport/racing?combo=1", sportSlug: "racing" },
  { label: "Indices", href: "/uxr-sport/indices?combo=1", sportSlug: "indices" },
];

export type PopularComboLeague = {
  title: string;
  sportSlug: string;
  league: string;
};

export const POPULAR_COMBO_LEAGUES: PopularComboLeague[] = [
  { title: "NFL", sportSlug: "football", league: "NFL" },
  { title: "NBA", sportSlug: "basketball", league: "NBA" },
  { title: "Premier League", sportSlug: "soccer", league: "Premier League" },
  { title: "MLB", sportSlug: "baseball", league: "MLB" },
  { title: "ATP", sportSlug: "tennis", league: "ATP" },
  { title: "UFC", sportSlug: "mma", league: "UFC" },
  { title: "PGA Tour", sportSlug: "pga", league: "PGA Tour" },
  { title: "CS2 Major", sportSlug: "esports", league: "CS2 Major" },
  { title: "Boxing", sportSlug: "boxing", league: "Boxing" },
  { title: "IPL", sportSlug: "cricket", league: "IPL" },
  { title: "Formula 1", sportSlug: "racing", league: "Formula 1" },
];

export const COMBO_SPORT_TABS = COMBO_NAV_CHIPS.filter(
  (chip): chip is ComboNavChip & { sportSlug: string } => Boolean(chip.sportSlug),
);

export function comboSportHref(sportSlug: string, league?: string): string {
  return league
    ? `/uxr-sport/${sportSlug}?league=${encodeURIComponent(league)}&combo=1`
    : `/uxr-sport/${sportSlug}?combo=1`;
}
