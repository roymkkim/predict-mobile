// Passes a league chosen on /uxr-leagues back to the sport page after pop.
// A module store keeps the sport screen mounted so the back animation can run.

let pending: { slug: string; league: string } | null = null;

export function queueSportLeagueSelection(slug: string, league: string): void {
  pending = { slug, league };
}

export function consumeSportLeagueSelection(slug: string): string | null {
  if (!pending || pending.slug !== slug) return null;
  const name = pending.league;
  pending = null;
  return name;
}
