import type { ComboPick } from "@/components/sim/ComboSheet";
import { openBetSlip, type BetSlipPick } from "./betSlipStore";
import { toggleComboPick } from "./comboPicksStore";

/** Combo ticket id for a StandardCard outcome. Binary Yes/No props include the question so cards don't share `y-n`. */
export function standardComboId(matchKey: string, key: string, titleText?: string): string {
  return `ml:${titleText ? `${titleText}:` : ""}${matchKey}:${key}`;
}

/** Add a parlay leg when Combinations flow is active; otherwise open the slip. */
export function placeComboOrSlip(comboMode: boolean, pick: ComboPick, slip: BetSlipPick): void {
  if (comboMode) {
    toggleComboPick(pick);
    return;
  }
  openBetSlip(slip);
}
