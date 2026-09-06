import { expandVol } from "../formatVol";

/** Average notional per trader — $82K Vol. → 2K traded. */
const DOLLARS_PER_TRADER = 41;

export function parseVolDollars(vol: string): number {
  const n = Number(expandVol(vol).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function compactTraders(count: number): string {
  const n = Math.max(0, Math.round(count));
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    const rounded = Number(k.toFixed(k >= 10 ? 0 : 1));
    if (rounded >= 1000) return "1M";
    return `${String(rounded).replace(/\.0$/, "")}K`;
  }
  const m = n / 1_000_000;
  const rounded = Number(m.toFixed(m >= 10 ? 0 : 1));
  return `${String(rounded).replace(/\.0$/, "")}M`;
}

export function tradedCountFromVol(vol: string): number {
  return Math.max(1, Math.round(parseVolDollars(vol) / DOLLARS_PER_TRADER));
}

export function tradedCopy(vol: string): string {
  return `${compactTraders(tradedCountFromVol(vol))} traded`;
}
