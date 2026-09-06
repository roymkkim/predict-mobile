import type { TextStyle, ViewStyle } from "react-native";
import { accessibleColor, accessibleTextOnLight, bgForWhiteText, colors, darken, marketAccentColor, MUTED_OUTLINE, ON_SURFACE_BUTTON_BG } from "./colors";
import type { ButtonSize, ButtonStyle, ButtonText, Density } from "./types";
import { getPillButtons } from "./pillButtonsStore";
import { getOutcomeButtonColorMode, type OutcomeButtonColorMode } from "./outcomeButtonColorStore";
import { getThemeMode } from "./dsModeStore";
import { geist } from "@/lib/sim/geistFonts";

// MetaMask Mobile Design System button foundations. The feed can supply its
// own market color, but shared geometry, label weight, and touch feedback stay
// consistent with the mobile template.
export const METAMASK_BUTTON_RADIUS = 12;
export const METAMASK_BUTTON_LABEL = {
  fontFamily: geist.medium,
  fontSize: 16,
  lineHeight: 24,
  letterSpacing: 0,
} as const;

export function buttonInteractionStyle(pressed: boolean, disabled = false): ViewStyle {
  return { opacity: disabled ? 0.5 : pressed ? 0.82 : 1 };
}

// The resolved native visual for a single card outcome button: a container style
// (background / border) and the text color. RN port of the web buttonStyle —
// returns StyleSheet-compatible objects instead of className + CSSProperties.
export type ButtonVisual = {
  container: ViewStyle;
  text: TextStyle;
  // Bottom-lip color for the polymarket 3D treatment (unused in Version A).
  lip?: string;
};

const GREEN_OUTLINE_VISUAL: ButtonVisual = {
  container: {
    backgroundColor: colors.surfaceTransparent,
    borderWidth: 1.5,
    borderColor: colors.greenOutline,
    borderRadius: METAMASK_BUTTON_RADIUS,
  },
  text: { color: colors.greenOutline },
};

function resolveButtonColors(buttonText: ButtonText, color: string): { bg: string; text: string } {
  switch (buttonText) {
    case "light-colored":
      return { bg: colors.controlActiveBg, text: accessibleTextOnLight(color, colors.controlActiveBg) };
    case "gray-white":
      return { bg: colors.surface2, text: colors.textPrimary };
    case "light-black":
      return { bg: colors.controlActiveBg, text: colors.controlActiveText };
    case "colored-white":
      return { bg: bgForWhiteText(color), text: colors.textPrimary };
    case "gray-colored":
    default:
      return { bg: colors.surface2, text: accessibleColor(color) };
  }
}

function polyLip(bg: string): string {
  return bg === colors.surface2 ? "rgba(0,0,0,0.5)" : darken(bg, 0.16);
}

export type OutcomeButtonOpts = {
  // Pass the subscribed store value so React Compiler cannot cache a stale visual.
  mode?: OutcomeButtonColorMode;
  // Yes / No / Up / Down keep green/red. Other labels follow the color mode,
  // even when their fixture color happens to be lime or red.
  label?: string;
  // Pass the subscribed pill value so carousel/card visuals cannot cache a 12px radius.
  pill?: boolean;
};

function isYesNoLabel(label?: string): boolean {
  if (!label) return false;
  const n = label.trim().toLowerCase();
  return n === "yes" || n === "no" || n === "up" || n === "down";
}

function yesNoText(color: string): string {
  return marketAccentColor(color).toLowerCase() === marketAccentColor(colors.red).toLowerCase() ? colors.red : colors.green;
}

export function outcomeButtonVisual(
  buttonStyle: ButtonStyle,
  buttonText: ButtonText,
  color: string,
  opts?: OutcomeButtonOpts,
): ButtonVisual {
  const radius = (opts?.pill ?? getPillButtons()) ? 999 : METAMASK_BUTTON_RADIUS;
  const mode = opts?.mode ?? getOutcomeButtonColorMode();
  const accent = marketAccentColor(color);
  const yesNo = isYesNoLabel(opts?.label);
  const pillOverride = { borderRadius: radius };

  if (mode === "fill") {
    const fill = yesNo
      ? marketAccentColor(color).toLowerCase() === marketAccentColor(colors.red).toLowerCase()
        ? colors.red
        : colors.green
      : accent;
    const lightSemantic =
      getThemeMode() === "light" && (fill === colors.green || fill === colors.red);
    return {
      container: { backgroundColor: fill, borderWidth: 0, borderColor: "transparent", ...pillOverride },
      text: { color: getThemeMode() === "light" || lightSemantic ? "#ffffff" : "#131416" },
    };
  }

  const text = yesNo ? yesNoText(color) : mode === "muted-white" ? colors.textPrimary : accessibleColor(accent);
  return {
    container: {
      backgroundColor: ON_SURFACE_BUTTON_BG,
      borderWidth: 0,
      borderColor: "transparent",
      borderStyle: "solid",
      borderRadius: radius,
    },
    text: { color: text },
  };
}

export type ComboUnselectedChrome = "muted" | "outline";

export type ComboOutcomeOpts = OutcomeButtonOpts & {
  /** Outline (default): TextAlternative, no fill, MUTED_OUTLINE. Muted fill is opt-in. */
  unselectedChrome?: ComboUnselectedChrome;
};

/** Unselected combo ¢: outline + TextAlternative. Selected is gradient stroke only. */
export function comboOutcomeVisual(selected: boolean, color: string, radius?: number, opts?: ComboOutcomeOpts): ButtonVisual {
  const r = radius ?? ((opts?.pill ?? getPillButtons()) ? 999 : METAMASK_BUTTON_RADIUS);
  if (!selected) {
    if (opts?.unselectedChrome === "muted") {
      const ink = outcomeButtonVisual("default", "gray-colored", color, { ...opts, mode: "muted-color" });
      return {
        container: {
          backgroundColor: ON_SURFACE_BUTTON_BG,
          borderWidth: 0,
          borderColor: "transparent",
          borderStyle: "solid",
          borderRadius: r,
        },
        text: ink.text,
      };
    }
    return {
      container: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: MUTED_OUTLINE,
        borderRadius: r,
      },
      text: { color: colors.textAlternative },
    };
  }
  const filled = outcomeButtonVisual("default", "gray-colored", color, opts);
  return {
    ...filled,
    container: {
      ...filled.container,
      borderRadius: r,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "transparent",
    },
  };
}

// Outcome-button sizing per density. Comfort gives every betting button a uniform
// 48px tall hit target with 16px labels; compact keeps the per-card sizing.
export function buttonMetrics(density: Density, buttonSize: ButtonSize): { btnH: number; fontSize: number } {
  if (density === "comfort") return { btnH: 48, fontSize: 16 };
  return { btnH: buttonSize === "md" ? 40 : 48, fontSize: 14 };
}

export function neutralButtonVisual(buttonStyle: ButtonStyle, buttonText: ButtonText): ButtonVisual {
  if (buttonStyle === "outline") return GREEN_OUTLINE_VISUAL;
  const light = buttonText === "light-colored" || buttonText === "light-black";
  const bg = light ? colors.controlActiveBg : colors.surface2;
  const text = light ? colors.controlActiveText : colors.textPrimary;
  if (buttonStyle === "polymarket") {
    return { container: { backgroundColor: bg }, text: { color: text }, lip: polyLip(bg) };
  }
  return { container: { backgroundColor: bg }, text: { color: text } };
}
