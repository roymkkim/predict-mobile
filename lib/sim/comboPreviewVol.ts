import { formatVol } from "@/lib/formatVol";

export type ComboVolSplitInput = {
  label: string;
  vol: string;
  rows: string[];
};

function parseVolDollars(vol: string): number | null {
  const m = vol.match(/\$\s*([\d.,]+)\s*([KMBT]?)/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const u = (m[2] || "").toUpperCase();
  const mult = u === "T" ? 1e12 : u === "B" ? 1e9 : u === "M" ? 1e6 : u === "K" ? 1e3 : 1;
  return Math.round(n * mult);
}

/** Stable 18–72 weight from template id + row copy (same every render). */
function comboRowVolWeight(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 997;
  return 18 + (h % 55);
}

/** Whole-$1K parts that sum to `total`; last index absorbs remainder. */
export function splitPositiveUnits(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (n === 1) return [Math.max(1, total)];
  const wsum = weights.reduce((a, b) => a + b, 0) || n;
  const parts: number[] = [];
  let used = 0;
  for (let i = 0; i < n - 1; i++) {
    const share = Math.max(1, Math.floor((total * weights[i]) / wsum));
    parts.push(share);
    used += share;
  }
  parts.push(total - used);
  if (parts[n - 1] < 1) {
    let need = 1 - parts[n - 1];
    parts[n - 1] = 1;
    for (let i = 0; i < n - 1 && need > 0; i++) {
      const take = Math.min(need, Math.max(0, parts[i] - 1));
      parts[i] -= take;
      need -= take;
    }
  }
  return parts;
}

/**
 * Split a template's single volume across legs. $1K units sum to the card total;
 * last leg takes the remainder. Display strings use the same `$XXK Vol.` format.
 */
export function splitComboPreviewVols(preview: ComboVolSplitInput): string[] {
  const n = preview.rows.length;
  const total = parseVolDollars(preview.vol);
  if (total == null || n === 0) return preview.rows.map(() => preview.vol);
  const totalK = Math.max(n, Math.round(total / 1000));
  const weights = preview.rows.map((row) => comboRowVolWeight(`${preview.label}:${row}`));
  return splitPositiveUnits(totalK, weights).map((k) => formatVol(`$${k * 1000} Vol.`));
}
