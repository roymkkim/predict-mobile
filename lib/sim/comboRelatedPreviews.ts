export type RelatedComboPreview = { label: string; rows: string[] };

export function comboPreviewSport(label: string): string | undefined {
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  if (key === "soccer") return "soccer";
  if (key === "baseball") return "baseball";
  if (key === "mma") return "mma";
  if (key === "tennis") return "tennis";
  if (key.includes("basketball")) return "basketball";
  if (key.includes("football") || key === "nfl" || key === "ncaaf") return "americanfootball";
  return undefined;
}

function matchSportKey(match: { sport?: string; league?: string }): string | undefined {
  const sport = (match.sport ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const league = (match.league ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (sport === "soccer" || league === "epl" || league === "mls" || league.includes("premier")) return "soccer";
  if (
    sport === "americanfootball" ||
    league === "nfl" ||
    league === "ncaaf" ||
    league === "ncaafootball"
  ) {
    return "americanfootball";
  }
  if (sport.includes("basketball") || league === "nba") return "basketball";
  if (sport.includes("tennis")) return "tennis";
  if (sport.includes("baseball") || league === "mlb") return "baseball";
  if (sport.includes("mma") || sport.includes("ufc") || league === "ufc" || league === "mma") return "mma";
  return sport || undefined;
}

/** Templates whose legs or sport belong to this event. */
export function comboPreviewsRelatedToMatch<T extends RelatedComboPreview>(
  match: { names: string[]; sport?: string; league?: string },
  previews: T[],
): T[] {
  const names = match.names.map((n) => n.trim().toLowerCase()).filter(Boolean);
  const sport = matchSportKey(match);
  return previews
    .map((preview, index) => {
      const nameHit = names.some((name) => preview.rows.some((row) => row.toLowerCase().includes(name)));
      const sportHit = sport != null && comboPreviewSport(preview.label) === sport;
      const score = (nameHit ? 2 : 0) + (sportHit ? 1 : 0);
      return { preview, score, index };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.preview);
}
