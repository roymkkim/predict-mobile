/** Combo legs: outcome phrase on line 1, matchup on line 2. */
export type ComboLegKind = "ml" | "spread" | "ou";

export const COMBO_TYPE_LABEL = {
  ml: "Moneyline",
  spread: "Spread",
  ou: "Total",
} as const;

export type ComboTypeLabel = (typeof COMBO_TYPE_LABEL)[ComboLegKind];

export type ComboLegCopyOpts = {
  kind?: ComboLegKind;
  id?: string;
  sport?: string;
  category?: string;
  period?: string;
};

/**
 * Chip beside the matchup. Default full-game moneyline has no period stored
 * and stays unlabeled. Stored windows (soccer regulation vs extra time,
 * baseball Full Game vs First 5, halves/quarters) get a short chip.
 */
export function comboPeriodTag(period?: string): string | undefined {
  const t = (period ?? "").trim();
  if (!t) return undefined;
  if (/^regulation\s+time$/i.test(t)) return "Reg time";
  if (/^full\s+game$/i.test(t)) return "Reg game";
  if (/^first\s+5(\s+innings)?$/i.test(t) || /^f5$/i.test(t)) return "First 5";
  if (/^(1st|first)\s+half$/i.test(t) || /^1h$/i.test(t)) return "1H";
  if (/^(2nd|second)\s+half$/i.test(t) || /^2h$/i.test(t)) return "2H";
  if (/^q[1-4]$/i.test(t)) return t.toUpperCase();
  return undefined;
}

const TYPE_PREFIX = /^(Moneyline|Spread|Total)\s+·\s+/i;
const LINE_TAIL = /\s([+-]?\d+(?:\.\d+)?)$/;
const OU_HEAD = /^(?:O|U|Over|Under)\s+([+-]?\d+(?:\.\d+)?)$/i;

export function comboTypeLabel(kind?: ComboLegKind, pick = "", id = ""): ComboTypeLabel {
  if (kind === "spread") return COMBO_TYPE_LABEL.spread;
  if (kind === "ou") return COMBO_TYPE_LABEL.ou;
  if (kind === "ml") return COMBO_TYPE_LABEL.ml;
  if (id.includes(":spread:")) return COMBO_TYPE_LABEL.spread;
  if (id.includes("total:") || id.includes(":ou:") || id.includes(":total:")) return COMBO_TYPE_LABEL.ou;
  if (/^(over|under)\b/i.test(pick) || /^[OU]\s/i.test(pick)) return COMBO_TYPE_LABEL.ou;
  if (LINE_TAIL.test(pick)) return COMBO_TYPE_LABEL.spread;
  return COMBO_TYPE_LABEL.ml;
}

/** Named team is the picker side — always +magnitude, never favorite-negative. */
function signedLine(raw: string): string {
  const n = parseFloat(raw);
  if (Number.isFinite(n)) return `+${Math.abs(n)}`;
  if (raw.startsWith("+") || raw.startsWith("-")) return `+${raw.slice(1)}`;
  return `+${raw}`;
}

/** Sport-config units: soccer/hockey goals, NBA/NFL points, MLB runs. */
export type TotalUnit = "goals" | "points" | "runs";

function sportKey(raw?: string): string {
  return (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

export function totalUnit(opts?: ComboLegCopyOpts): TotalUnit | undefined {
  const sport = sportKey(opts?.sport);
  if (sport === "soccer" || sport === "hockey") return "goals";
  if (sport === "basketball" || sport === "americanfootball") return "points";
  if (sport === "baseball") return "runs";

  const blob = [opts?.sport, opts?.category, opts?.id].filter(Boolean).join(" ").toLowerCase();
  if (!blob.trim()) return undefined;
  if (
    /\b(soccer|epl|premier league|la liga|serie a|bundesliga|ligue 1|\bmls\b|uefa|world cup|champions league|hockey|\bnhl\b)\b/.test(
      blob,
    )
  ) {
    return "goals";
  }
  if (/\b(mlb|baseball)\b/.test(blob)) return "runs";
  if (/\b(nba|basketball|nfl|american\s*football|pro football)\b/.test(blob)) return "points";
  return undefined;
}

function parseOu(pick: string): { side: "over" | "under"; line: string } | null {
  const m = pick.trim().match(OU_HEAD);
  if (!m) return null;
  const side = /^U/i.test(pick.trim()) ? "under" : "over";
  return { side, line: m[1] };
}

function totalPhrase(pick: string, opts?: ComboLegCopyOpts): string {
  const parsed = parseOu(pick);
  if (!parsed) {
    if (/^O\s/i.test(pick)) return pick.replace(/^O\s+/i, "Over ");
    if (/^U\s/i.test(pick)) return pick.replace(/^U\s+/i, "Under ");
    return pick;
  }
  const unit = totalUnit(opts);
  if (unit) return `Total ${unit} ${parsed.side} ${parsed.line}`;
  return `Total ${parsed.side} ${parsed.line}`;
}

function splitLabel(label: string): { left: string; matchup: string } {
  const sep = label.indexOf("·");
  let left = (sep < 0 ? label : label.slice(0, sep)).trim();
  left = left.replace(TYPE_PREFIX, "").trim();
  const matchup = sep < 0 ? "" : label.slice(sep + 1).trim();
  return { left, matchup };
}

export function comboLegCopy(
  label: string,
  opts?: ComboLegCopyOpts,
): { pick: string; sub: string; seed: string; tag?: string } {
  const { left, matchup } = splitLabel(label);
  const type = comboTypeLabel(opts?.kind, left, opts?.id);
  const tag = comboPeriodTag(opts?.period);
  const extra = tag ? { tag } : {};

  if (type === COMBO_TYPE_LABEL.ou) {
    return { pick: totalPhrase(left, opts), sub: matchup, seed: left, ...extra };
  }

  if (type === COMBO_TYPE_LABEL.spread) {
    const m = left.match(/^(.*?)\s+([+-]?\d+(?:\.\d+)?)$/);
    if (m) return { pick: `${m[1]} to win by ${signedLine(m[2])}`, sub: matchup, seed: m[1], ...extra };
  }

  if (/^draw$/i.test(left)) return { pick: "Draw", sub: matchup, seed: left, ...extra };
  return { pick: `${left} to win`, sub: matchup, seed: left, ...extra };
}
