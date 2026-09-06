export const COMBO_AFFORDANCE_STORAGE_KEY = "predict.combo-affordance";
export type ComboAffordance = "sheet" | "cart";
export const COMBO_AFFORDANCE_DEFAULT: ComboAffordance = "cart";

export const COMBO_CART_FAB_SIZE = 48;
export const COMBO_CART_FAB_INSET = 24;
/** ComboMark glyph in the cart / Next pill. */
export const COMBO_CART_PILL_MARK_SIZE = 20;
/** Left inset so the mark stays optically centered in the 48px disc. */
export const COMBO_CART_PILL_LEADING_PAD = (COMBO_CART_FAB_SIZE - COMBO_CART_PILL_MARK_SIZE) / 2;
/** ComboMark right edge → payout label. */
export const COMBO_CART_PILL_MARK_GAP = 8;
/** Payout label → arrow. */
export const COMBO_CART_PILL_ARROW_GAP = 4;
/** Right inset after the arrow so the pill matches the 48px mark well. */
export const COMBO_CART_PILL_TRAILING_PAD = 8;
/** BodyMd “Next” — fallback when there is no payout copy. */
export const COMBO_CART_PILL_NEXT_WIDTH = 36;
export const COMBO_CART_PILL_ARROW_SIZE = 16;
/** Width + label fade when the cart grows from circle to pill. */
export const COMBO_CART_PILL_EXPAND_MS = 240;

/** Combined multiple — independent of stake. Empty cart is 0. */
export function comboPayoutMultiple(picks: { cents: number }[]): number {
  if (picks.length === 0) return 0;
  const p = picks.reduce((acc, pick) => acc * (pick.cents / 100), 1);
  if (!(p > 0)) return 0;
  return 1 / p;
}

/** `{n}X payout` — independent of stake. Empty cart has no label. */
export function comboPayoutMultipleLabel(picks: { cents: number }[]): string {
  if (picks.length === 0) return "";
  return `${comboPayoutMultiple(picks).toFixed(1)}X payout`;
}

/** BodyMd 16 / medium — generous advance so the pill never clips. */
export function comboCartPayoutLabelWidth(label: string): number {
  if (!label) return COMBO_CART_PILL_NEXT_WIDTH;
  return Math.min(168, Math.max(COMBO_CART_PILL_NEXT_WIDTH, Math.ceil(label.length * 8.8)));
}

export function comboCartFabWidth(itemCount: number, payoutLabel?: string): number {
  if (itemCount < 1) return COMBO_CART_FAB_SIZE;
  const labelW = payoutLabel ? comboCartPayoutLabelWidth(payoutLabel) : COMBO_CART_PILL_NEXT_WIDTH;
  return (
    COMBO_CART_PILL_LEADING_PAD +
    COMBO_CART_PILL_MARK_SIZE +
    COMBO_CART_PILL_MARK_GAP +
    labelW +
    COMBO_CART_PILL_ARROW_GAP +
    COMBO_CART_PILL_ARROW_SIZE +
    COMBO_CART_PILL_TRAILING_PAD
  );
}
/** MMDS BadgeCount Md: 16×16 (`min-w-4 h-4`), circle via `rounded-lg`. */
export const COMBO_CART_BADGE_SIZE = 16;
/** Half of badge height — 1-digit stays a disc. */
export const COMBO_CART_BADGE_RADIUS = COMBO_CART_BADGE_SIZE / 2;
export const COMBO_CART_BADGE_OVERLAP = 4;

/** Center of the count badge on the cart FAB (top-right overlap). */
export function comboCartBadgeCenter(layout: {
  x: number;
  y: number;
  width: number;
}): { x: number; y: number } {
  return {
    x: layout.x + layout.width + COMBO_CART_BADGE_OVERLAP - COMBO_CART_BADGE_SIZE / 2,
    y: layout.y - COMBO_CART_BADGE_OVERLAP + COMBO_CART_BADGE_SIZE / 2,
  };
}
/** Gap between leading close circle and cart FAB. */
export const COMBO_CART_CLOSE_GAP = 12;
/** Filled charcoal close circle left of the cart. */
export const COMBO_CART_CLOSE_BUTTON_SIZE = 32;

export function parseComboAffordance(raw: string | null | undefined): ComboAffordance {
  if (raw === "sheet") return "sheet";
  if (raw === "cart") return "cart";
  return COMBO_AFFORDANCE_DEFAULT;
}

/** Sports tile landing (`/uxr-categories?sports=1`) — list or hub. Explore omits `sports`. */
export function isSportsLandingPath(pathname: string, sports?: string): boolean {
  const [pathPart, query = ""] = pathname.split("?");
  const path = pathPart.replace(/\/$/, "") || "/";
  if (path !== "/uxr-categories") return false;
  const flag = sports ?? new URLSearchParams(query).get("sports") ?? undefined;
  return flag === "1" || flag === "true";
}

/**
 * Combo mode (cart, selected-leg chrome, Build a Combo) stays on Combos,
 * sport/league category pages, the Sports landing, and the game / event
 * surfaces those pages open. Home, Politics, Crypto, and Live never participate.
 */
export function isComboCapablePath(pathname: string, sports?: string): boolean {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path === "/combination") return true;
  if (isEventDetailPath(pathname)) return true;
  if (isSportsLandingPath(pathname, sports)) return true;
  if (path.startsWith("/uxr-sport/") || path.startsWith("/kalshi-sport/")) return true;
  if (path.startsWith("/uxr-league/") || path.startsWith("/kalshi-league/")) return true;
  return false;
}

/** Combos index: never auto-open the empty sheet. It only appears when the
 *  slip is already open and the last pick is removed (Delete all). */
export function comboIndexOpensEmptySheet(_opts: {
  pathname: string;
  pickCount: number;
  hasTemplate?: boolean;
}): boolean {
  return false;
}

/** Combos index (Picks / sport tabs) — combo is the page, not a mode you exit. */
export function isComboIndexPath(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/combination";
}

/** Game / match / tennis / prediction detail — empty-sheet X stays in combo. */
export function isEventDetailPath(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/match-detail" || path === "/game-detail" || path === "/tennis-detail" || path === "/prediction-detail";
}

/**
 * Unselected combo ¢: MUTED_OUTLINE + TextAlternative on every combo-capable
 * surface. Home feed stays muted fill because those cards pass combo={false}.
 */
export function comboPageUnselectedChrome(pathname: string, sports?: string): "muted" | "outline" {
  return isComboCapablePath(pathname, sports) ? "outline" : "muted";
}

/** Cart FAB no longer shows a leading close — category pages exit to Build a Combo. */
export function comboCartExitVisible(_pathname: string): boolean {
  return false;
}

/**
 * Sport / league category pages: the empty "Build your combo" sheet X
 * restores Build a Combo. Combos index and event detail stay in combo.
 */
export function comboCartEmptyExitsFlow(pathname: string, sports?: string): boolean {
  if (isComboIndexPath(pathname) || isEventDetailPath(pathname)) return false;
  if (isSportsLandingPath(pathname, sports)) return true;
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path.startsWith("/uxr-sport/") || path.startsWith("/kalshi-sport/")) return true;
  if (path.startsWith("/uxr-league/")) return true;
  return false;
}

/** Empty-sheet X dismisses the tray but does not restore Build a Combo. */
export function comboEmptyCloseKeepsFlow(pathname: string): boolean {
  return isComboIndexPath(pathname) || isEventDetailPath(pathname);
}

/** Empty tray: copy sits flush under HeaderStandard; 40px below the copy to the sheet bottom. */
export const COMBO_EMPTY_TITLE_FROM_HEADER = 16;
export const COMBO_EMPTY_BODY_FROM_TITLE = 0;
export const COMBO_EMPTY_BODY_MARGIN_BOTTOM = 40;
/** Visible gap from the close X (ButtonIcon box) to the sheet’s right edge. Combos page stays at 16. */
export const COMBO_SHEET_CLOSE_EDGE_INSET = 16;
/** @deprecated use COMBO_SHEET_CLOSE_EDGE_INSET */
export const COMBO_EMPTY_HEADER_PADDING_RIGHT = COMBO_SHEET_CLOSE_EDGE_INSET;
export const COMBO_FILLED_HEADER_PADDING_BOTTOM = 12;
/** Next footer: 16px from the footer/separator edge down to the button. */
export const COMBO_NEXT_FOOTER_PADDING_TOP = 16;
export const COMBO_SHEET_PANEL_TEST_ID = "combo-sheet-panel";

/** Zero-state docked tray must not swallow feed taps so the first leg can be added. */
export function comboEmptySheetPassThrough(opts: { pickCount: number; screen: number }): boolean {
  return opts.pickCount === 0 && opts.screen === 0;
}

/** Filled slip never uses a dismiss overlay — feed stays scrollable and tappable. */
export function comboFilledSheetDismissesOnBackdrop(_opts: { pickCount: number; screen: number }): boolean {
  return false;
}

/** Outside tap never closes the slip; only the sheet X or page back. */
export function comboOutsideTapDismisses(_opts: {
  pickCount: number;
  screen: number;
  listAlwaysExpanded: boolean;
  expanded: boolean;
}): boolean {
  return false;
}

/** Cart opens the filled slip as the list, with no collapse picker. */
export function comboCartListAlwaysExpanded(affordance: ComboAffordance): boolean {
  return affordance === "cart";
}

/** Undocked Buy more / preview slips dismiss fully. Docked cart morphs to FAB. */
export function comboCloseDropsOverlay(docked: boolean): boolean {
  return !docked;
}

/** Docked empty "Build your combo" sheet is sheet-mode only. Cart uses the FAB.
 * Event detail always keys off slipOpen so X can hide the tray and keep combo. */
export function dockedComboSheetVisible(opts: {
  affordance: ComboAffordance;
  docked: boolean;
  pickCount: number;
  slipOpen: boolean;
  pathname?: string;
}): boolean {
  if (!opts.docked) return true;
  if (opts.affordance === "cart") return opts.slipOpen;
  if (opts.pathname && isEventDetailPath(opts.pathname)) return opts.slipOpen;
  return true;
}

export function comboCartFabVisible(opts: {
  affordance: ComboAffordance;
  combinationsOn: boolean;
  comboFlow: boolean;
  pathname: string;
  slipOpen: boolean;
  morphing: boolean;
  sports?: string;
}): boolean {
  if (opts.affordance !== "cart") return false;
  if (!opts.combinationsOn || !opts.comboFlow) return false;
  if (!isComboCapablePath(opts.pathname, opts.sports)) return false;
  if (opts.slipOpen || opts.morphing) return false;
  return true;
}

/** Cart stays 24px from the screen right; close hangs to the left with a 12px gap. */
export function comboCartCloseLeading(exitVisible: boolean): number {
  return exitVisible ? COMBO_CART_CLOSE_GAP + COMBO_CART_CLOSE_BUTTON_SIZE : 0;
}

const ANCHOR_SLACK = 8;

/** Trailing-edge pin only when the slot is on-screen with a real size. */
export function comboCartAnchorUsable(
  windowWidth: number,
  windowHeight: number,
  anchor?: { x: number; y: number; width: number; height: number } | null,
  fabWidth: number = COMBO_CART_FAB_SIZE,
): boolean {
  if (!anchor) return false;
  if (!(anchor.width > 0 && anchor.height > 0)) return false;
  const size = COMBO_CART_FAB_SIZE;
  const x = anchor.x + anchor.width - fabWidth;
  const y = anchor.y + (anchor.height - size) / 2;
  if (x < -ANCHOR_SLACK || y < -ANCHOR_SLACK) return false;
  if (x + fabWidth > windowWidth + ANCHOR_SLACK) return false;
  if (y + size > windowHeight + ANCHOR_SLACK) return false;
  return true;
}

/** Gap between the live-chat composer and the combo cart FAB. */
export const COMBO_CHAT_COMPOSER_GAP = 12;

/** Composer sits on the FAB row: same bottom inset, 12px left of the cart. */
export function comboChatComposerInsets(
  safeBottom: number,
  opts?: { itemCount?: number; payoutLabel?: string; safeRight?: number },
): { bottom: number; right: number } {
  const fabW = comboCartFabWidth(opts?.itemCount ?? 0, opts?.payoutLabel);
  const trailing = COMBO_CART_FAB_INSET + Math.max(0, opts?.safeRight ?? 0);
  return {
    bottom: COMBO_CART_FAB_INSET + Math.max(0, safeBottom),
    right: trailing + fabW + COMBO_CHAT_COMPOSER_GAP,
  };
}

/**
 * Home / Live / Politics are not combo surfaces. Clear leftover flow there so
 * a live-carousel tap into game detail does not reopen combo mode.
 */
export function comboFlowReconcile(capable: boolean, fromQuery: boolean): "enter" | "exit" | "keep" {
  if (capable && fromQuery) return "enter";
  if (!capable) return "exit";
  return "keep";
}

export function comboCartFabLayout(
  windowWidth: number,
  windowHeight: number,
  safeBottom: number,
  opts?: {
    exitVisible?: boolean;
    /** ≥1 expands to the payout pill; right edge stays 24px from the screen. */
    itemCount?: number;
    /** BodyMd `{n}X payout` — widens the filled pill. */
    payoutLabel?: string;
    /** Home-indicator / notch inset on the trailing edge. */
    safeRight?: number;
  },
): { x: number; y: number; width: number; height: number; radius: number } {
  const height = COMBO_CART_FAB_SIZE;
  const width = comboCartFabWidth(opts?.itemCount ?? 0, opts?.payoutLabel);
  const radius = height / 2;
  const inset = COMBO_CART_FAB_INSET;
  const bottom = inset + Math.max(0, safeBottom);
  const right = inset + Math.max(0, opts?.safeRight ?? 0);
  return {
    x: windowWidth - right - width,
    y: windowHeight - bottom - height,
    width,
    height,
    radius,
  };
}
