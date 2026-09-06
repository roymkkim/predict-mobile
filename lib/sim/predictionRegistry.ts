import type { OutcomeAvatar, PoliticsMarket } from "./types";
import * as data from "./data";

// Every PoliticsMarket/CryptoMarket exported from data.ts, discovered by shape
// so newly-added markets are picked up automatically. The detail page looks a
// market up by its question text (passed as the `pm` route param).
const ALL: PoliticsMarket[] = Object.values(data).filter(
  (v): v is PoliticsMarket =>
    !!v && typeof v === "object" && !Array.isArray(v) && "question" in v && "outcomes" in v,
);

export function findPredictionMarket(q?: string | string[]): PoliticsMarket | undefined {
  if (typeof q !== "string" || !q) return undefined;
  const exact = ALL.find((m) => m.question === q);
  if (exact) return exact;
  const lower = q.toLowerCase();
  if (lower.includes("alvarez") && (lower.includes("club") || lower.includes("transfer"))) {
    return ALL.find((m) => m.question === "Julian Alvarez: Next Club");
  }
  if (lower.includes("clarity") || lower.includes("3633")) {
    return ALL.find((m) => m.question === "Clarity Act (H.R.3633) signed into law in 2026?");
  }
  if (/\bbtc\b|bitcoin/i.test(lower) && /up or down/i.test(lower)) {
    return ALL.find((m) => m.category === "BTC") ?? ALL.find((m) => /bitcoin/i.test(m.question));
  }
  return undefined;
}

/** Outcome avatar for a bet-slip pick, matched by market question + outcome name in the title. */
export function outcomeAvatarForPick(marketQuestion?: string, title?: string): OutcomeAvatar | undefined {
  const market = findPredictionMarket(marketQuestion) ?? findPredictionMarket(title);
  if (!market || !title) return undefined;
  const hay = title.toLowerCase();
  const ranked = market.outcomes
    .filter((o) => o.avatar && hay.includes(o.label.toLowerCase()))
    .sort((a, b) => b.label.length - a.label.length);
  return ranked[0]?.avatar;
}

// Split a market's total volume string (e.g. "$21.7M Vol.") into per-outcome
// volumes proportional to each outcome's probability. Falls back to the raw
// string when the format is unrecognized.
export function splitVol(vol: string, pcts: number[]): string[] {
  const m = vol.match(/\$\s*([\d.,]+)\s*([KMB]?)/i);
  if (!m) return pcts.map(() => vol);
  const total = parseFloat(m[1].replace(/,/g, ""));
  const unit = m[2].toUpperCase();
  const mult = unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1;
  const sum = pcts.reduce((a, b) => a + b, 0) || 1;
  return pcts.map((p) => {
    const v = (total * mult * p) / sum;
    const fmt =
      v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}K` : `$${Math.round(v)}`;
    return `${fmt} Vol.`;
  });
}
