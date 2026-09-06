// Home Combos carousel → Combos Picks. Queue the add so the page can finish
// sliding in, then play the cart-drop.

/** Match `stackSlideTransitionSpec.open` so the add waits for the push to settle. */
export const COMBO_PAGE_SLIDE_MS = 350;
export const COMBO_PAGE_SETTLE_MS = 180;
export const CAROUSEL_ADD_DELAY_MS = COMBO_PAGE_SLIDE_MS + COMBO_PAGE_SETTLE_MS;

let pendingAddLabel: string | null = null;

export function queueComboTemplateAdd(label: string): void {
  pendingAddLabel = label;
}

export function hasPendingComboTemplateAdd(): boolean {
  return pendingAddLabel != null;
}

export function pendingComboTemplateAddIs(label: string): boolean {
  return pendingAddLabel === label;
}

export function consumeComboTemplateAdd(label: string): boolean {
  if (pendingAddLabel !== label) return false;
  pendingAddLabel = null;
  return true;
}

export function clearComboTemplateAdd(): void {
  pendingAddLabel = null;
}
