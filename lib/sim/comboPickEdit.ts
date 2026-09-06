import type { ComboPick } from "@/components/sim/ComboSheet";
import { SPREAD_LINES } from "@/lib/sim/spreadLines";
import { resolveComboAvatar } from "@/lib/sim/comboTeamMark";
import { soccerShowsDraw } from "@/lib/sim/soccerMoneyline";

function matchupOf(label: string): { headline: string; market: string; home: string; away: string } | null {
  const sep = label.indexOf("·");
  const headline = (sep < 0 ? label : label.slice(0, sep)).trim();
  const market = sep < 0 ? "" : label.slice(sep + 1).trim();
  const vs = market.split(/\s+vs\.?\s+/i);
  if (vs.length !== 2) return null;
  return { headline, market, home: vs[0].trim(), away: vs[1].trim() };
}

const LINE_TOKEN = /[+-]?\d+(?:\.\d+)?/;
const LINE_TAIL = new RegExp(`\\s+${LINE_TOKEN.source}$`);

function lineMagnitude(n: number): number {
  return Math.abs(n);
}

function lineFromHeadline(headline: string): number | undefined {
  const m = headline.match(new RegExp(`(${LINE_TOKEN.source})\\s*$`));
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? lineMagnitude(n) : undefined;
}

function headlineTeamName(headline: string): string {
  return headline.replace(LINE_TAIL, "").trim();
}

function lineIndexOf(lines: number[], line: number): number {
  const mag = lineMagnitude(line);
  return lines.findIndex((x) => x === mag || Math.abs(x - mag) < 1e-9);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namesMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return true;
  if (x.length <= 4 && y.startsWith(x)) return true;
  if (y.length <= 4 && x.startsWith(y)) return true;
  if (x.length <= 4 && y.slice(0, 3) === x.slice(0, 3)) return true;
  return false;
}

function isHomeSide(headlineName: string, home: string, away: string): boolean {
  if (namesMatch(headlineName, away) && !namesMatch(headlineName, home)) return false;
  if (namesMatch(headlineName, home)) return true;
  return true;
}

function rewriteLine(s: string, prev: number, next: number): string {
  const a = String(lineMagnitude(prev));
  const b = String(lineMagnitude(next));
  if (a === b) return s;
  const signed = new RegExp(`[+-]${escapeRegExp(a)}(?!\\d)`, "g");
  if (signed.test(s)) return s.replace(new RegExp(`[+-]${escapeRegExp(a)}(?!\\d)`, "g"), `+${b}`);
  if (s.includes(`@${a}`)) return s.split(`@${a}`).join(`@${b}`);
  if (s.includes(`+${a}`)) return s.split(`+${a}`).join(`+${b}`);
  if (s.includes(` ${a}`)) return s.split(` ${a}`).join(` ${b}`);
  if (s.includes(`:${a}`)) return s.split(`:${a}`).join(`:${b}`);
  const glued = new RegExp(`([A-Za-z])${escapeRegExp(a)}(?!\\d)`, "g");
  if (glued.test(s)) return s.replace(new RegExp(`([A-Za-z])${escapeRegExp(a)}(?!\\d)`, "g"), `$1${b}`);
  return s;
}

/** Stable row id so changing the spread line does not remount the pick. */
export function comboPickRowKey(id: string): string {
  return id
    .replace(/@[\d.]+$/, "")
    .replace(/[+-]\d+(?:\.\d+)?$/, "")
    .replace(/(@[A-Za-z]+)\d+(?:\.\d+)?/g, "$1");
}

/** Same market family (game + kind), ignoring the active team / line. */
export function comboPickFamilyKey(id: string): string {
  return comboPickRowKey(id)
    .replace(/:[^:]+$/, "")
    .replace(/:flip$/, "");
}

function exclusiveMatchup(p: Pick<ComboPick, "id" | "label">): string {
  const parsed = matchupOf(p.label);
  if (parsed?.market) return parsed.market.toLowerCase().replace(/\s+/g, " ");
  return comboPickFamilyKey(p.id).toLowerCase();
}

function exclusiveKind(p: Pick<ComboPick, "id" | "kind" | "label">): "ml" | "spread" | "ou" | "bin" {
  if (p.kind === "spread" || p.id.includes(":spread:") || p.id.startsWith("spread:")) return "spread";
  if (p.kind === "ou" || p.id.includes("total:") || p.id.includes(":ou:") || p.id.includes(":total:")) return "ou";
  if (p.kind === "ml" || p.id.startsWith("ml:") || /(?:^|:)draw$/i.test(p.id)) return "ml";
  const sep = p.label.indexOf("·");
  const headline = (sep < 0 ? p.label : p.label.slice(0, sep)).trim();
  if (/^(over|under)\b/i.test(headline) || /^[OU]\s/i.test(headline)) return "ou";
  if (LINE_TAIL.test(headline)) return "spread";
  if (sep >= 0) return "ml";
  return "bin";
}

/** One live leg per exclusive market (3-way/2-way ML, spread side, OU side). */
export function comboExclusiveGroupKey(p: Pick<ComboPick, "id" | "label" | "kind" | "period">): string {
  const kind = exclusiveKind(p);
  const period = (p.period ?? "").trim().toLowerCase();
  if (kind === "bin") return `bin:${comboPickFamilyKey(p.id)}`;
  return `${kind}:${exclusiveMatchup(p)}:${period}`;
}

export function upsertExclusiveComboPick(list: ComboPick[], pick: ComboPick): ComboPick[] {
  const group = comboExclusiveGroupKey(pick);
  const idx = list.findIndex((p) => comboExclusiveGroupKey(p) === group);
  if (idx < 0) return [...list, pick];
  return [...list.slice(0, idx), pick, ...list.slice(idx + 1).filter((p) => comboExclusiveGroupKey(p) !== group)];
}

/** Toggle off the same outcome; otherwise swap any conflicting exclusive leg. */
export function toggleExclusiveComboPick(list: ComboPick[], pick: ComboPick): ComboPick[] {
  const group = comboExclusiveGroupKey(pick);
  const existing = list.find((p) => comboExclusiveGroupKey(p) === group);
  if (
    existing &&
    (existing.id === pick.id || comboPickRowKey(existing.id) === comboPickRowKey(pick.id))
  ) {
    return list.filter((p) => comboExclusiveGroupKey(p) !== group);
  }
  return upsertExclusiveComboPick(list, pick);
}

export function comboOutcomeOn(picks: ComboPick[], id: string): boolean {
  const row = comboPickRowKey(id);
  return picks.some((p) => p.id === id || comboPickRowKey(p.id) === row);
}

export function comboPickForPrefix(picks: ComboPick[], prefix: string): ComboPick | undefined {
  return picks.find((p) => p.id.startsWith(prefix) || comboPickRowKey(p.id).startsWith(prefix));
}

export function comboMirroredIndex(index: number, dividerAt: number, labels: string[]): number {
  if (dividerAt <= 0 || dividerAt >= labels.length) return index;
  const line = labels[index];
  if (line == null) return index;
  if (index < dividerAt) {
    const j = labels.slice(dividerAt).indexOf(line);
    return j >= 0 ? dividerAt + j : dividerAt;
  }
  const j = labels.slice(0, dividerAt).lastIndexOf(line);
  return j >= 0 ? j : Math.max(0, dividerAt - 1);
}

export function comboPickLine(p: ComboPick): number | undefined {
  if (p.line != null) return lineMagnitude(p.line);
  const sep = p.label.indexOf("·");
  const headline = (sep < 0 ? p.label : p.label.slice(0, sep)).trim();
  return lineFromHeadline(headline);
}

export function comboPickIsSpread(p: ComboPick): boolean {
  if (p.kind === "ou") return false;
  if (p.kind === "spread") return true;
  if (/to win by/i.test(p.label) || /to win by/i.test(p.id)) return true;
  if (p.id.includes(":spread:")) return true;
  if (p.id.includes("total:") || p.id.includes(":ou:") || p.id.includes(":total:")) return false;
  return comboPickLine(p) != null && p.kind !== "ml";
}

export function comboPickIsOu(p: ComboPick): boolean {
  return isOuPick(p);
}

/** Stable strip identity so team flip / line change does not remount LinePicker. */
export function comboPickStripKey(p: ComboPick): string {
  const parsed = matchupOf(p.label);
  if (comboPickIsSpread(p) && parsed?.market) return `spread:${parsed.market}`;
  if (isOuPick(p) && parsed?.market) return `ou:${parsed.market}:${p.period ?? ""}`;
  return comboPickRowKey(p.id);
}

const DEFAULT_TOTAL_LINES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];

export function comboPickLines(p: ComboPick): number[] {
  if (p.lines && p.lines.length > 0) return p.lines;
  return isOuPick(p) ? DEFAULT_TOTAL_LINES : SPREAD_LINES;
}

function plusifyStoredLine(s: string): string {
  return s.replace(/([:\s@])-(\d+(?:\.\d+)?)(?!\d)/g, "$1+$2");
}

function flipOuHeadline(headline: string): string | null {
  if (/^over\b/i.test(headline)) return headline.replace(/^over/i, "Under");
  if (/^under\b/i.test(headline)) return headline.replace(/^under/i, "Over");
  if (/^o\s/i.test(headline)) return headline.replace(/^o\s/i, "U ");
  if (/^u\s/i.test(headline)) return headline.replace(/^u\s/i, "O ");
  return null;
}

function isDrawName(name: string): boolean {
  return /^draw$/i.test(name.trim());
}

function isOuPick(p: ComboPick): boolean {
  return p.kind === "ou" || p.id.includes("total:") || p.id.includes(":ou:") || p.id.includes(":total:");
}

/** Soccer league / cricket 3-way ML — Draw stays in the tray swap loop. */
export function comboMlIsThreeWay(p: ComboPick, headline?: string): boolean {
  if (comboPickIsSpread(p) || isOuPick(p)) return false;
  const name = (headline ?? comboHeadlineFromPick(p)).trim();
  if (isDrawName(name) || /(?:^|:)draw$/i.test(p.id)) return true;
  const sport = (p.sport ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (sport === "cricket") return true;
  const blob = [p.sport, p.category, p.label].join(" ").toLowerCase();
  if (/\bcricket\b|\bt20\b|\bipl\b/.test(blob)) return true;
  if (["basketball", "americanfootball", "hockey", "baseball"].includes(sport)) return false;
  if (sport === "soccer") return soccerShowsDraw({ sport: "soccer", league: p.category ?? "" });
  return false;
}

function comboHeadlineFromPick(p: ComboPick): string {
  const sep = p.label.indexOf("·");
  return (sep < 0 ? p.label : p.label.slice(0, sep)).trim();
}

function replaceMlSideToken(id: string, token: string): string {
  if (!id.includes(":")) return `${id}:${token}`;
  return id.replace(/:[^:]+$/, `:${token}`);
}

function mlSideTokens(id: string, home: string, away: string, headline: string): { home: string; away: string } {
  const segs = id.split(":");
  const last = segs[segs.length - 1] ?? "";
  if (segs.length >= 2) {
    const maybeKey = segs[segs.length - 2];
    const pair = maybeKey.match(/^([a-z0-9]{2,8})-([a-z0-9]{2,8})$/i);
    if (pair) {
      const upper = /[A-Z]/.test(last) || last.length <= 4;
      const homeTok = isDrawName(last)
        ? upper
          ? pair[1].toUpperCase()
          : pair[1]
        : namesMatch(headline, home) || namesMatch(last, home)
          ? last
          : upper
            ? pair[1].toUpperCase()
            : pair[1];
      const awayTok = isDrawName(last)
        ? upper
          ? pair[2].toUpperCase()
          : pair[2]
        : namesMatch(headline, away) || namesMatch(last, away)
          ? last
          : upper
            ? pair[2].toUpperCase()
            : pair[2];
      return { home: homeTok, away: awayTok };
    }
  }
  const g = id.match(/-([A-Za-z]{2,5})-([A-Za-z]{2,5})-\d+/);
  if (g) return { home: g[1], away: g[2] };
  return { home, away };
}

function clampCents(n: number): number {
  return Math.max(8, Math.min(92, Math.round(n)));
}

function threeWayPrices(p: ComboPick, headline: string, home: string, away: string): { home: number; draw: number; away: number } {
  if (p.mlPrices) return p.mlPrices;
  const alt = p.alt?.cents;
  if (isDrawName(headline)) {
    const draw = p.cents;
    const rest = Math.max(16, 100 - draw);
    const homeC = alt != null ? clampCents(alt) : clampCents(rest * 0.55);
    return { home: homeC, draw, away: clampCents(100 - draw - homeC) };
  }
  if (isHomeSide(headline, home, away)) {
    const homeC = p.cents;
    const awayC = alt != null ? alt : clampCents(100 - homeC);
    const draw = clampCents(Math.max(8, 100 - homeC - awayC));
    return { home: homeC, draw, away: awayC };
  }
  const awayC = p.cents;
  const homeC = alt != null ? alt : clampCents(100 - awayC);
  const draw = clampCents(Math.max(8, 100 - homeC - awayC));
  return { home: homeC, draw, away: awayC };
}

type MlSlot = "home" | "draw" | "away";

function currentMlSlot(headline: string, home: string, away: string): MlSlot {
  if (isDrawName(headline)) return "draw";
  return isHomeSide(headline, home, away) ? "home" : "away";
}

function cycleMlComboPick(p: ComboPick, parsed: { headline: string; market: string; home: string; away: string }): ComboPick {
  const three = comboMlIsThreeWay(p, parsed.headline);
  const order: MlSlot[] = three ? ["home", "draw", "away"] : ["home", "away"];
  const slot = currentMlSlot(parsed.headline, parsed.home, parsed.away);
  const idx = Math.max(0, order.indexOf(slot));
  const next = order[(idx + 1) % order.length] ?? order[0];
  const tokens = mlSideTokens(p.id, parsed.home, parsed.away, parsed.headline);
  const prices = three ? threeWayPrices(p, parsed.headline, parsed.home, parsed.away) : undefined;
  const headlineFor = (s: MlSlot): string => (s === "draw" ? "Draw" : s === "home" ? parsed.home : parsed.away);
  const tokenFor = (s: MlSlot): string => (s === "draw" ? "draw" : s === "home" ? tokens.home : tokens.away);
  const centsFor = (s: MlSlot): number => {
    if (prices) return prices[s];
    return s === slot ? p.cents : clampCents(100 - p.cents);
  };
  const colorFor = (s: MlSlot): string => {
    if (s === "draw") return isDrawName(parsed.headline) ? p.color : "#71717a";
    if (s === slot) return p.color;
    return p.alt?.color ?? p.color;
  };
  const nextHeadline = headlineFor(next);
  const nextLabel = `${nextHeadline} · ${parsed.market}`;
  const nextId = replaceMlSideToken(p.id, tokenFor(next));
  const nextAvatar = next === "draw" ? undefined : resolveComboAvatar(nextLabel, next === slot ? p.avatar : p.alt?.avatar);
  return {
    ...p,
    id: nextId,
    label: nextLabel,
    cents: centsFor(next),
    color: colorFor(next),
    avatar: nextAvatar,
    mlPrices: prices,
    alt: {
      id: p.id,
      label: p.label,
      color: p.color,
      cents: p.cents,
      avatar: p.avatar ?? resolveComboAvatar(p.label),
    },
  };
}

function flipOuId(id: string): string {
  if (id.includes(":over:")) return id.replace(":over:", ":under:");
  if (id.includes(":under:")) return id.replace(":under:", ":over:");
  if (id.includes("over@")) return id.replace("over@", "under@");
  if (id.includes("under@")) return id.replace("under@", "over@");
  if (id.includes(":yes@")) return id.replace(":yes@", ":no@");
  if (id.includes(":no@")) return id.replace(":no@", ":yes@");
  return `${id}:flip`;
}

export function flipComboPick(p: ComboPick): ComboPick | null {
  const parsed = matchupOf(p.label);
  if (parsed && comboMlIsThreeWay(p, parsed.headline)) {
    return cycleMlComboPick(p, parsed);
  }
  if (p.alt) {
    const prev = p.alt;
    return {
      ...p,
      id: plusifyStoredLine(prev.id),
      label: plusifyStoredLine(prev.label),
      color: prev.color,
      cents: prev.cents,
      avatar: prev.avatar ?? resolveComboAvatar(prev.label),
      alt: {
        id: plusifyStoredLine(p.id),
        label: plusifyStoredLine(p.label),
        color: p.color,
        cents: p.cents,
        avatar: p.avatar ?? resolveComboAvatar(p.label),
      },
    };
  }
  if (!parsed) return null;
  const otherOu = flipOuHeadline(parsed.headline);
  if (otherOu && (p.kind === "ou" || p.id.includes("total:") || p.id.includes(":ou:") || p.id.includes(":total:"))) {
    const otherLabel = `${otherOu} · ${parsed.market}`;
    return {
      ...p,
      id: flipOuId(p.id),
      label: plusifyStoredLine(otherLabel),
      cents: Math.max(8, Math.min(92, 100 - p.cents)),
      avatar: resolveComboAvatar(otherLabel, p.alt?.avatar),
      alt: {
        id: p.id,
        label: p.label,
        color: p.color,
        cents: p.cents,
        avatar: p.avatar ?? resolveComboAvatar(p.label),
      },
    };
  }
  const line = lineFromHeadline(parsed.headline);
  const name = headlineTeamName(parsed.headline);
  const otherName = isHomeSide(name, parsed.home, parsed.away) ? parsed.away : parsed.home;
  const otherHeadline = line != null ? `${otherName} +${line}` : otherName;
  const otherLabel = `${otherHeadline} · ${parsed.market}`;
  return {
    ...p,
    id: p.id.includes(name) ? p.id.split(name).join(otherName) : `${p.id}:flip`,
    label: otherLabel,
    cents: Math.max(8, Math.min(92, 100 - p.cents)),
    avatar: resolveComboAvatar(otherLabel, p.alt?.avatar),
    alt: {
      id: p.id,
      label: p.label,
      color: p.color,
      cents: p.cents,
      avatar: p.avatar ?? resolveComboAvatar(p.label),
    },
  };
}

export function comboSpreadPickerState(p: ComboPick): { labels: string[]; dividerAt: number; index: number } | null {
  const lines = comboPickLines(p);
  if (lines.length === 0) return null;
  const parsed = matchupOf(p.label);
  const line = comboPickLine(p) ?? lines[0];
  const homeLines = [...lines].reverse();
  const labels = [...homeLines, ...lines].map(String);
  const dividerAt = lines.length;
  const name = parsed ? headlineTeamName(parsed.headline) : "";
  const home = parsed ? isHomeSide(name, parsed.home, parsed.away) : true;
  const idxIn = home ? lineIndexOf(homeLines, line) : lineIndexOf(lines, line);
  let index: number;
  if (idxIn >= 0) {
    index = home ? idxIn : dividerAt + idxIn;
  } else {
    const other = home ? lineIndexOf(lines, line) : lineIndexOf(homeLines, line);
    index = other < 0 ? dividerAt : home ? dividerAt + other : other;
  }
  return { labels, dividerAt, index };
}

/** Totals strip: one line ladder. Over/Under stays exclusive (swap button, not the slider). */
export function comboTotalsPickerState(p: ComboPick): { labels: string[]; index: number } | null {
  const lines = comboPickLines(p);
  if (lines.length === 0) return null;
  const line = comboPickLine(p) ?? lines[0];
  const idx = lineIndexOf(lines, line);
  return { labels: lines.map(String), index: idx >= 0 ? idx : 0 };
}

export function comboPickAtTotalsIndex(p: ComboPick, i: number): ComboPick {
  const lines = comboPickLines(p);
  const line = lines[i];
  if (line == null) return p;
  return setComboPickLine(p, line);
}

export function comboPickAtSpreadIndex(p: ComboPick, i: number): ComboPick {
  const lines = comboPickLines(p);
  if (lines.length === 0) return p;
  const dividerAt = lines.length;
  const homeLines = [...lines].reverse();
  const onHome = i < dividerAt;
  const line = (onHome ? homeLines[i] : lines[i - dividerAt]) ?? lines[0];
  const parsed = matchupOf(p.label);
  const name = parsed ? headlineTeamName(parsed.headline) : "";
  const currentlyHome = parsed ? isHomeSide(name, parsed.home, parsed.away) : true;
  let next = p;
  if (parsed && onHome !== currentlyHome) {
    const flipped = flipComboPick(p);
    if (flipped) next = flipped;
  }
  return setComboPickLine(next, line);
}

export function setComboPickLine(p: ComboPick, line: number): ComboPick {
  const prev = comboPickLine(p) ?? line;
  if (prev === line) {
    return {
      ...p,
      line,
      id: plusifyStoredLine(p.id),
      label: plusifyStoredLine(p.label),
      alt: p.alt
        ? { ...p.alt, id: plusifyStoredLine(p.alt.id), label: plusifyStoredLine(p.alt.label) }
        : undefined,
    };
  }
  const alt = p.alt
    ? {
        ...p.alt,
        id: plusifyStoredLine(rewriteLine(p.alt.id, prev, line)),
        label: plusifyStoredLine(rewriteLine(p.alt.label, prev, line)),
      }
    : undefined;
  return {
    ...p,
    id: plusifyStoredLine(rewriteLine(p.id, prev, line)),
    label: plusifyStoredLine(rewriteLine(p.label, prev, line)),
    line,
    alt,
  };
}
