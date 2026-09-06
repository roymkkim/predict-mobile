/** Payout copy for combo templates and the cart header. Lives outside ComboSheet
 * so event pages can import CombinationsSection without a ComboSheet cycle. */

export const COMBO_HEADER_STAKE = 10;

export function fmtComboPaysAmount(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function comboToWin(picks: { cents: number }[], stake: number): number {
  if (picks.length === 0) return 0;
  const p = picks.reduce((acc, pick) => acc * (pick.cents / 100), 1);
  return stake / p - stake;
}

/** "$10 pays $X,XXX" — projected total return for a $10 stake on current legs. */
export function comboPaysCopy(picks: { cents: number }[], stake: number = COMBO_HEADER_STAKE): string {
  const total = stake + comboToWin(picks, stake);
  return `$${stake} pays ${fmtComboPaysAmount(total)}`;
}

/** Stake-screen subtitle — profit only. */
export function comboToWinCopy(picks: { cents: number }[], stake: number): string {
  return `To win ${fmtComboPaysAmount(comboToWin(picks, stake))}`;
}
