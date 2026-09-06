// Compact a volume string so its number never exceeds 3 display digits, e.g.
// "$25,547,348 vol" -> "$25.5M vol". Strings that are already within 3 digits
// are returned unchanged so existing casing/formatting is preserved.
export function formatVol(raw: string): string {
  const match = raw.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*([kmbtKMBT])?/);
  if (!match) return raw;

  const digitCount = match[1].replace(/[^\d]/g, "").length;
  if (digitCount <= 3) return raw;

  const mantissa = parseFloat(match[1].replace(/,/g, ""));
  if (!isFinite(mantissa)) return raw;

  const unit = (match[2] || "").toLowerCase();
  const unitMult =
    unit === "t" ? 1e12 : unit === "b" ? 1e9 : unit === "m" ? 1e6 : unit === "k" ? 1e3 : 1;
  const value = mantissa * unitMult;

  const label = raw.slice((match.index ?? 0) + match[0].length).trim();
  const compact = compactNumber(value);
  return label ? `${compact} ${label}` : compact;
}

// Inverse of formatVol: expand an abbreviated volume to its full digit count
// with thousands separators, e.g. "$2.4M Vol." -> "$2,400,000 Vol.". Values that
// are already full ("$25,547,348 vol") round-trip unchanged. The trailing label
// (e.g. "vol" / "Vol.") is preserved. Comma grouping is done manually rather than
// via toLocaleString, which Hermes does not reliably format.
export function expandVol(raw: string): string {
  const match = raw.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*([kmbtKMBT])?/);
  if (!match) return raw;

  const mantissa = parseFloat(match[1].replace(/,/g, ""));
  if (!isFinite(mantissa)) return raw;

  const unit = (match[2] || "").toLowerCase();
  const unitMult =
    unit === "t" ? 1e12 : unit === "b" ? 1e9 : unit === "m" ? 1e6 : unit === "k" ? 1e3 : 1;
  const value = Math.round(mantissa * unitMult);

  const label = raw.slice((match.index ?? 0) + match[0].length).trim();
  const grouped = value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const full = `$${grouped}`;
  return label ? `${full} ${label}` : full;
}

function compactNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const tiers: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (let i = 0; i < tiers.length; i++) {
    const [base, suffix] = tiers[i];
    if (abs >= base) {
      const scaled = abs / base;
      const digits = scaled >= 100 ? 0 : 1;
      const rounded = Number(scaled.toFixed(digits));
      // Rounding can carry into the next-higher tier (e.g. 999.9M -> 1B).
      if (rounded >= 1000 && i > 0) {
        const carried = Number((abs / tiers[i - 1][0]).toFixed(1));
        return `${sign}$${trimZero(carried)}${tiers[i - 1][1]}`;
      }
      return `${sign}$${trimZero(rounded)}${suffix}`;
    }
  }
  return `${sign}$${trimZero(Number(abs.toFixed(0)))}`;
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}
