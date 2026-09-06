// Predict brand palette — ported verbatim from the predict-simulator-2 design
// tool (artifacts/predict-simulator-2/src/lib/colors.ts) so the native rebuild
// of "Version A" matches the web reference exactly. Pure TS, RN-safe.
export const PREDICT_PALETTE = {
  // Dark elevation: cards use surface; nested controls, buttons, and tags use surface2.
  bg: "#000000",
  // Filled chips (LIVE / period pills). Dark keeps a high-contrast black pill.
  muted: "#141414",
  surface: "#18181B",
  surface2: "#222226",
  tagSurface: "#222226",
  surfaceTransparent: "#18181B",
  cardBorder: "#ffffff14",
  textPrimary: "#ffffff",
  textAlternative: "#9B9B9B",
  textMuted: "#a3a4a7",
  mono: "#a3a4a7",
  accent: "#4459ff",
  controlAccent: "#6b6c70",
  controlActiveBg: "#e6e7ea",
  controlActiveText: "#16171a",
  // success.default
  green: "#baf24a",
  greenOutline: "#baf24a",
  greenSoft: "#baf24a26",
  red: "#ff7584",
  redSoft: "#ff758426",
  liveGlow: "#ff758433",
  bitcoin: "#f7931a",
  // Per-market accent palette (crypto/politics/sports outcome colors) so cards
  // don't all read as the same green/blue pair. Brand-ish hues; accessibleColor
  // brightens them for contrast against the dark surface at render time.
  solPurple: "#9945ff",
  solTeal: "#14f195",
  xrpCyan: "#26c6da",
  indigo: "#818cf8",
  sky: "#38bdf8",
  dogeGold: "#e0b53d",
  rose: "#fb7185",
  violet: "#a78bfa",
  emerald: "#34d399",
  amber: "#f59e0b",
  slate: "#8a93b8",
  ethBlue: "#7c8af0",
  teal: "#2dd4bf",
  cyan: "#22d3ee",
  nbaBlue: "#1e58cd",
  nbaBlueSoft: "#6095ff",
  nbaOrange: "#f05210",
  doosanRed: "#bc0014",
  liveOrange: "#ff5c16",
  liveYellow: "#facc15",
  spainRed: "#c8102e",
  spainYellow: "#ffc400",
} as const;

// Mutable working palette. `dsModeStore.setDsMode` swaps these values between
// the Predict brand palette and the MetaMask design-token overrides at
// runtime, then remounts the feed so components re-read the new values.
export const colors: Record<keyof typeof PREDICT_PALETTE, string> = {
  ...PREDICT_PALETTE,
};

// Nested control on `surface` (#18181B): E2E2FF at 11% opacity.
export const ON_SURFACE_BUTTON_BG = "rgba(226,226,255,0.11)";
/** Unselected market / Add CTAs: hairline outline, no fill. */
export const MUTED_OUTLINE = "rgba(226,226,255,0.15)";

// Shared filter-chip treatment used by the Sports pages: inactive chips blend
// into the page, while the selected chip gets a subtle gray button surface.
export const FILTER_CHIP_ACTIVE_BG = ON_SURFACE_BUTTON_BG;
export const FILTER_CHIP_INACTIVE_TEXT = "#9B9B9B";

export function filterChipBackground(active: boolean): string {
  return active ? FILTER_CHIP_ACTIVE_BG : "transparent";
}

let semanticTheme: "dark" | "light" = "dark";

export function setSemanticTheme(next: "dark" | "light"): void {
  semanticTheme = next;
}

// MetaMask muted border tokens used by SVG chart guides. Keep the base color
// and opacity separate because composite rgba strings can disappear in SVG.
export function chartGridColor(theme: "dark" | "light"): string {
  return theme === "light" ? "#B4B4B5" : "#E2E2FF";
}

export function chartGridOpacity(theme: "dark" | "light"): number {
  return theme === "light" ? 0.4 : 0.15;
}

// Background used by neutral draw/tie outcome buttons. The dark reference
// uses a light gray fill so the neutral option reads as a selectable button
// rather than blending into the card surface.
export function backgroundMuted(theme: "dark" | "light"): string {
  return theme === "light" ? "rgba(60,77,157,0.10)" : "#D0D2D9";
}

/** Filled period/LIVE chip fill. Light uses MetaMask background.muted. */
export function filledChipBackground(): string {
  return colors.muted;
}

/** Label on a filled period/LIVE chip. */
export function filledChipForeground(): string {
  return semanticTheme === "light" ? colors.textPrimary : "#ffffff";
}

export const RADIUS = 12;

const REF_SURFACE = colors.surface2;

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  const part = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a: number, b: number): number {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((((h % 360) + 360) % 360) / 60);
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

export function accessibleColor(hex: string, ratio = 4.5): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const surfRgb = parseHex(REF_SURFACE);
  if (!surfRgb) return hex;
  const surfLum = relLuminance(surfRgb);

  const [h, s0, l0] = rgbToHsl(rgb);
  const s = s0 < 0.12 ? s0 : Math.min(1, s0 * 1.1 + 0.14);

  const round = (c: [number, number, number]): [number, number, number] => [
    Math.round(c[0]),
    Math.round(c[1]),
    Math.round(c[2]),
  ];
  const passesAt = (l: number) =>
    contrastRatio(relLuminance(round(hslToRgb(h, s, l))), surfLum) >= ratio;

  if (passesAt(l0)) return toHex(...round(hslToRgb(h, s, l0)));

  let lo = l0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passesAt(mid)) hi = mid;
    else lo = mid;
  }
  let l = hi;
  for (let i = 0; i < 64 && l <= 1; i++) {
    const candidate = round(hslToRgb(h, s, l));
    if (contrastRatio(relLuminance(candidate), surfLum) >= ratio) {
      return toHex(...candidate);
    }
    l += 1 / 256;
  }
  return "#ffffff";
}

export function bgForWhiteText(hex: string, ratio = 4.5): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const whiteRgb = parseHex(colors.textPrimary);
  if (!whiteRgb) return hex;
  const whiteLum = relLuminance(whiteRgb);

  const [h, s0, l0] = rgbToHsl(rgb);
  const s = s0 < 0.12 ? s0 : Math.min(1, s0 * 1.1 + 0.14);

  const round = (c: [number, number, number]): [number, number, number] => [
    Math.round(c[0]),
    Math.round(c[1]),
    Math.round(c[2]),
  ];
  const passesAt = (l: number) =>
    contrastRatio(whiteLum, relLuminance(round(hslToRgb(h, s, l)))) >= ratio;

  if (passesAt(l0)) return toHex(...round(hslToRgb(h, s, l0)));

  let lo = 0;
  let hi = l0;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passesAt(mid)) lo = mid;
    else hi = mid;
  }
  let l = lo;
  for (let i = 0; i < 64 && l >= 0; i++) {
    const candidate = round(hslToRgb(h, s, l));
    if (contrastRatio(whiteLum, relLuminance(candidate)) >= ratio) {
      return toHex(...candidate);
    }
    l -= 1 / 256;
  }
  return "#000000";
}

export function accessibleTextOnLight(hex: string, bgHex: string, ratio = 4.5): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const bgRgb = parseHex(bgHex);
  if (!bgRgb) return hex;
  const bgLum = relLuminance(bgRgb);

  const [h, s0, l0] = rgbToHsl(rgb);
  const s = s0 < 0.12 ? s0 : Math.min(1, s0 * 1.1 + 0.14);

  const round = (c: [number, number, number]): [number, number, number] => [
    Math.round(c[0]),
    Math.round(c[1]),
    Math.round(c[2]),
  ];
  const passesAt = (l: number) =>
    contrastRatio(bgLum, relLuminance(round(hslToRgb(h, s, l)))) >= ratio;

  if (passesAt(l0)) return toHex(...round(hslToRgb(h, s, l0)));

  let lo = 0;
  let hi = l0;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passesAt(mid)) lo = mid;
    else hi = mid;
  }
  let l = lo;
  for (let i = 0; i < 64 && l >= 0; i++) {
    const candidate = round(hslToRgb(h, s, l));
    if (contrastRatio(bgLum, relLuminance(candidate)) >= ratio) {
      return toHex(...candidate);
    }
    l -= 1 / 256;
  }
  return "#000000";
}

// Cap a bar-fill color's luminance so very bright hues (lime green, relLum ~0.55)
// don't anti-alias ("bloom") visibly thicker than dimmer accents (blue/red,
// relLum ~0.3) when a thin 2px underline renders at retina DPR. Only darkens
// colors above the cap; dimmer colors pass through unchanged. The cap (~0.38)
// sits near the red/blue accent level and still clears 4.5:1 on the dark surface.
export function barFill(hex: string, cap = 0.38): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  if (relLuminance(rgb) <= cap) return hex;
  const [h, s, l0] = rgbToHsl(rgb);
  let lo = 0;
  let hi = l0;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (relLuminance(hslToRgb(h, s, mid)) > cap) hi = mid;
    else lo = mid;
  }
  return toHex(...hslToRgb(h, s, lo));
}

// Pastel tint for the UXR solid outcome buttons: mixes the team color toward
// white in RGB space so dark near-black text stays readable on every team hue
// (e.g. Chiefs red -> salmon, Packers green -> lime wash).
export function pastel(hex: string, amount = 0.55): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return toHex(mix(rgb[0]), mix(rgb[1]), mix(rgb[2]));
}

// UXR button/line-chart palette (user-provided): every accent color snaps to
// the nearest of these six hues instead of using raw team colors.
// Named tokens for the approved 6-color palette. Use these instead of raw
// hex literals so bars, buttons, and charts always share the same color.
export const UXR = {
  red: "#FF7584",
  orange: "#FFA680",
  green: "#BAF24A",
  indigo: "#8B99FF",
  blue: "#8CE3FF",
  yellow: "#FFC800",
} as const;

export const UXR_PALETTE = [
  "#FF7584", // red
  "#FFA680", // orange
  "#BAF24A", // green
  "#8B99FF", // indigo
  "#8CE3FF", // blue
  "#FFC800", // yellow
] as const;

// Snap an arbitrary color to the UXR palette by hue distance (e.g. Packers
// green -> BAF24A, Steelers gold -> FFC800, Panthers blue -> 8CE3FF). Near-
// grayscale inputs (Draw, neutral outcomes) have no meaningful hue, so they
// get a neutral light gray that still carries dark text.
export function uxrPaletteColor(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [h, s] = rgbToHsl(rgb);
  if (s < 0.12) return "#cfd2d9";
  // Explicit hue bands (not nearest-hue distance: the palette's lime green
  // sits at ~80°, so a mid-green like #4ade80 would otherwise snap to blue).
  if (h < 15 || h >= 330) return semanticTheme === "light" ? colors.red : "#FF7584"; // red
  if (h < 45) return "#FFA680"; // orange
  if (h < 72) return "#FFC800"; // yellow
  if (h < 170) return semanticTheme === "light" ? colors.green : "#BAF24A"; // green
  if (h < 212) return "#8CE3FF"; // blue
  if (h < 285) return "#8B99FF"; // indigo
  return "#FF7584"; // magenta/pink -> red
}

// Canonical team accent for market UI. Buttons, probability bars, and charts
// all use this resolved UXR color; sport avatars must use it too instead of
// substituting an official/raw team color that can drift from the market.
export function marketAccentColor(hex: string): string {
  return uxrPaletteColor(hex);
}

// Resolve legacy semantic literals through the active theme. Older fixtures
// still carry the dark UXR swatches as data, but success/error UI must follow
// the light reference palette after a theme switch.
export function semanticColor(hex: string): string {
  const normalized = hex.toLowerCase();
  if (normalized === "#baf24a" || normalized === "#527941") return colors.green;
  if (normalized === "#ff7584" || normalized === "#f58f98" || normalized === "#ba4247") return colors.red;
  return hex;
}

export function buttonTextOnColor(): string {
  return semanticTheme === "light" ? "#ffffff" : "#131416";
}

export function darken(hex: string, amount = 0.16): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [h, s, l] = rgbToHsl(rgb);
  const [r, g, b] = hslToRgb(h, s, Math.max(0, l - amount));
  return toHex(r, g, b);
}

export default colors;
