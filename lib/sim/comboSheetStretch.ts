/** Compact tray is a half-window; drag-up can grow until the page header. */
export const COMBO_SHEET_HALF_RATIO = 0.5;

export type ComboSheetStretchLayout = {
  winH: number;
  topH: number;
  footerH: number;
  /** Y of the page header’s bottom edge. Sheet top cannot rise above this. */
  ceiling: number;
  chrome?: number;
};

export function comboSheetCompactListMaxH(opts: Pick<ComboSheetStretchLayout, "winH" | "topH" | "footerH">): number {
  return Math.max(0, opts.winH * COMBO_SHEET_HALF_RATIO - opts.topH - opts.footerH);
}

export function comboSheetExpandedListMaxH(opts: ComboSheetStretchLayout): number {
  const chrome = opts.chrome ?? 0;
  return Math.max(0, opts.winH - opts.ceiling - chrome - opts.topH - opts.footerH);
}

export function comboSheetMaxStretch(opts: ComboSheetStretchLayout): number {
  return Math.max(0, comboSheetExpandedListMaxH(opts) - comboSheetCompactListMaxH(opts));
}

export function comboSheetListMaxH(opts: ComboSheetStretchLayout & { stretch: number }): number {
  const compact = comboSheetCompactListMaxH(opts);
  const expanded = comboSheetExpandedListMaxH(opts);
  return Math.min(expanded, compact + Math.max(0, opts.stretch));
}

/** Compact hugs content; drag-up grows the clip even if content hasn’t been remeasured. */
export function comboSheetListShownH(opts: {
  expanded: boolean;
  listNatural: number;
  listMaxH: number;
  stretch: number;
}): number {
  if (!opts.expanded) return 0;
  if (opts.stretch > 0) return Math.max(0, opts.listMaxH);
  return Math.max(0, Math.min(opts.listNatural, opts.listMaxH));
}

export function comboSheetPageHeaderBottom(topInset: number, navH: number): number {
  return topInset + navH;
}

/** dy < 0 is an upward drag. Extra downward travel after stretch hits 0 becomes dismissDy. */
export function sheetHeaderStretchFromDy(
  startStretch: number,
  dy: number,
  maxStretch: number,
): { stretch: number; dismissDy: number } {
  const cap = Math.max(0, maxStretch);
  const raw = startStretch - dy;
  if (raw >= cap) return { stretch: cap, dismissDy: 0 };
  if (raw >= 0) return { stretch: raw, dismissDy: 0 };
  return { stretch: 0, dismissDy: -raw };
}

export function sheetHeaderDismissAfterStretch(opts: {
  startStretch: number;
  stretch: number;
  dy: number;
  vy: number;
  dismissDy?: number;
  dismissVy?: number;
}): boolean {
  if (opts.startStretch > 0 || opts.stretch > 0) return false;
  return opts.dy > (opts.dismissDy ?? 64) || opts.vy > (opts.dismissVy ?? 0.9);
}

export const SHEET_STRETCH_SNAP_VY = 0.5;

/** Release snaps to compact (0) or full (max). vy < 0 is an upward flick. */
export function sheetHeaderStretchSnap(stretch: number, maxStretch: number, vy: number): number {
  const cap = Math.max(0, maxStretch);
  if (cap <= 0) return 0;
  if (vy < -SHEET_STRETCH_SNAP_VY) return cap;
  if (vy > SHEET_STRETCH_SNAP_VY) return 0;
  return stretch >= cap / 2 ? cap : 0;
}
