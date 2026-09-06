// Canonical recognizable team accents for sport-specific identity treatments.
// Buttons, probability bars, pills, and charts keep their shared fixture color
// pipeline (uxrPaletteColor); baseball highlighted bases also resolve through
// this map so they stay aligned with the same team accent.
//
// Colors are the teams' official primaries (helmet shell / jersey color),
// picked for recognizability on the dark background.
const REAL_TEAM_COLORS: Record<string, string> = {
  // NFL
  CAR: "#0085CA", // Panthers process blue
  ARI: "#97233F", // Cardinals cardinal red
  PIT: "#FFB612", // Steelers gold (helmet stripe/logo on black)
  KC: "#E31837", // Chiefs red
  BUF: "#00338D", // Bills royal blue
  // NBA
  LAL: "#552583", // Lakers purple
  BOS: "#007A33", // Celtics green
  SAS: "#C4CED4", // Spurs silver
  NYK: "#F58426", // Knicks orange
  // MLB
  NYY: "#D71920", // Yankees red treatment used by the prediction accents
  LAD: "#005A9C", // Dodgers blue
};

// Realistic gear color for a team; falls back to the provided palette color
// for teams without an official mapping.
export function realTeamColor(abbr: string | undefined, fallback: string): string {
  return (abbr && REAL_TEAM_COLORS[abbr]) || fallback;
}
