/** Featured league shortcuts on the Sports hub pill rail. */
export const SPORTS_HUB_LEAGUE_PILLS: readonly { key: string; label: string; href: string }[] = [
  { key: "mlb", label: "MLB", href: "/uxr-sport/baseball?league=MLB" },
  { key: "nfl", label: "NFL", href: "/uxr-sport/football?league=NFL" },
];

export type SportsHubPill = { key: string; label: string; href: string };

/** MLB / NFL first, then every sport category from the list view. */
export function sportsHubPillsFromSports(sports: { slug: string; label: string }[]): SportsHubPill[] {
  return [
    ...SPORTS_HUB_LEAGUE_PILLS,
    ...sports.map((sport) => ({
      key: sport.slug,
      label: sport.label,
      href: `/uxr-sport/${sport.slug}`,
    })),
  ];
}
