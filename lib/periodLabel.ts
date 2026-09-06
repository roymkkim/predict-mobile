export function periodLabel(league: string, mins: string): string | null {
  const m = parseInt(mins, 10);
  if (Number.isNaN(m)) return null;
  const lg = league.toLowerCase();
  if (
    lg.includes("fifa") ||
    lg.includes("world cup") ||
    lg.includes("soccer") ||
    lg.includes("premier") ||
    lg.includes("serie") ||
    lg.includes("liga") ||
    lg.includes("champions")
  ) {
    return m <= 45 ? "1H" : "2H";
  }
  if (
    lg.includes("nba") ||
    lg.includes("aba") ||
    lg.includes("cba") ||
    lg.includes("euroleague") ||
    lg.includes("basket")
  ) {
    if (m <= 12) return "Q1";
    if (m <= 24) return "Q2";
    if (m <= 36) return "Q3";
    return "Q4";
  }
  return null;
}
