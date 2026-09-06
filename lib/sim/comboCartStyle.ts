import { COMBO_BRAND_STYLE_DEFAULT, type ComboBrandStyle } from "./comboBrandStore";
import { colors, MUTED_OUTLINE } from "./colors";

export const COMBO_CART_STYLE_STORAGE_KEY = "predict.combo-cart-style";

/** Outline = transparent FAB + gradient stroke + lime count. Fill = gradient disc + black mark + card-surface badge. */
export type ComboCartStyle = "outline" | "fill";
export const COMBO_CART_STYLE_DEFAULT: ComboCartStyle = "fill";

/** Fill count badge: same fill as game/combo cards (`colors.surface`), white numeral. */
export const COMBO_CART_FILL_BADGE_BG = colors.surface;
export const COMBO_CART_FILL_BADGE_FG = "#ffffff";
/** 1px ring so the surface badge reads on dark UI and on lime. */
export const COMBO_CART_BADGE_BORDER = MUTED_OUTLINE;
export const COMBO_CART_BADGE_BORDER_WIDTH = 1;
/** Outline count badge: success lime, dark numeral. */
export const COMBO_CART_OUTLINE_BADGE_BG = "#baf24a";
export const COMBO_CART_OUTLINE_BADGE_FG = "#111111";
/** Flat brand: error red so the count stays visible on a white cart disc. Black numeral. */
export const COMBO_CART_FLAT_BADGE_BG = colors.red;
export const COMBO_CART_FLAT_BADGE_FG = "#111111";

export function comboCartBadgeColors(
  style: ComboCartStyle,
  brand: ComboBrandStyle = COMBO_BRAND_STYLE_DEFAULT,
): { backgroundColor: string; color: string } {
  if (brand === "flat") {
    return { backgroundColor: COMBO_CART_FLAT_BADGE_BG, color: COMBO_CART_FLAT_BADGE_FG };
  }
  if (style === "fill") {
    return { backgroundColor: COMBO_CART_FILL_BADGE_BG, color: COMBO_CART_FILL_BADGE_FG };
  }
  return { backgroundColor: COMBO_CART_OUTLINE_BADGE_BG, color: COMBO_CART_OUTLINE_BADGE_FG };
}

export function parseComboCartStyle(raw: string | null | undefined): ComboCartStyle {
  if (raw === "fill") return "fill";
  if (raw === "outline") return "outline";
  return COMBO_CART_STYLE_DEFAULT;
}
