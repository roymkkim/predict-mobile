import type { PossessionMode } from "@/lib/sim/types";

// Possession cues are temporarily disabled. Keep the prop shape so existing
// card presets can be restored without changing their layout contracts.
export function Possession({
  mode: _mode,
  color: _color,
  sport: _sport,
  invisible: _invisible = false,
}: {
  mode: PossessionMode;
  color: string;
  sport?: string;
  invisible?: boolean;
}) {
  // Possession cues are temporarily disabled while the score card is being
  // simplified. Keep the component and settings types intact so the cue can
  // be restored without reworking the card layouts.
  return null;
}
