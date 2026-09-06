import { createContext, useContext } from "react";
import { colors } from "./colors";
import type { LiveCueColor } from "./types";

// The resolved color set for a live cue (dot + clock text, corner glow wash, and
// the transparent endpoint used by the border-gradient fade).
export type LiveCueColors = { color: string; glow: string; fade: string };

export function getLiveCueColors(cue: LiveCueColor): LiveCueColors {
  return cue === "green"
    ? { color: colors.green, glow: colors.greenSoft, fade: "rgba(0,0,0,0)" }
    : { color: colors.red, glow: colors.redSoft, fade: "rgba(0,0,0,0)" };
}

export const LIVE_CUE_COLORS: Record<LiveCueColor, LiveCueColors> = {
  red: getLiveCueColors("red"),
  green: getLiveCueColors("green"),
};

const LiveCueColorContext = createContext<LiveCueColors>(LIVE_CUE_COLORS.red);

export function LiveCueColorProvider({
  cue,
  children,
}: {
  cue: LiveCueColor;
  children: React.ReactNode;
}) {
  return (
      <LiveCueColorContext.Provider value={getLiveCueColors(cue)}>
      {children}
    </LiveCueColorContext.Provider>
  );
}

export const useLiveCueColors = () => useContext(LiveCueColorContext);
