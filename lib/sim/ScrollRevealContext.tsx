import { createContext, useContext, type RefObject } from "react";
import { Animated, type View } from "react-native";
import type { RevealMode } from "./types";

// Drives the "reveal on scroll" border animation: as a live card scrolls up
// into the viewport, its live-cue accent border fades in from the left corner.
// The provider lives on the home ScrollView (which owns the scroll offset and
// viewport height); each LiveBorder measures its own offset within the scroll
// content and interpolates the shared scrollY into an accent opacity.
export type CardBox = { y: number; h: number };

// Center-highlight variants:
// - "off":     no center highlight.
// - "face":    outcome-button backgrounds cross-fade to a white highlight face.
// - "reflect": a subtle holographic light shimmer sweeps the centered card
//              (like light over a vinyl Pokémon card). `reflectTarget` picks
//              where the sheen lands: the border ring, the card surface, or both.
export type CenterHighlightMode = "off" | "face" | "reflect";
export type ReflectTarget = "border" | "surface" | "both";

export type ScrollReveal = {
  // "off" = no reveal (static borders), "live" = only live-game cards reveal on
  // scroll, "all" = every accent border reveals on scroll.
  mode: RevealMode;
  // Center-highlight effect: as a card's vertical center nears the viewport
  // center it lights up via the selected variant (see CenterHighlightMode).
  centerHighlight: CenterHighlightMode;
  // Where the "reflect" variant's sheen lands (ignored for other variants).
  reflectTarget: ReflectTarget;
  // True only when a real provider wraps the tree (the home feed). Lets per-card
  // hooks decide whether scroll-driven entrance effects (e.g. the probability-bar
  // grow-in) should run; off-provider pages render their bars statically.
  present: boolean;
  scrollY: Animated.Value;
  viewportH: number;
  contentH: number;
  topPad: number;
  contentRef: RefObject<View | null>;
  // Registry of measured card boxes (offset + height within the scroll content),
  // keyed by a stable per-card id. Used by the center-highlight hook to find the
  // next card below it so it can cap its lit window and keep focus on exactly one
  // card at a time (no two highlighted simultaneously). `cardsVersion` bumps when
  // the registry changes so dependent memos recompute.
  cards: RefObject<Map<string, CardBox>>;
  cardsVersion: number;
  // Bumps to replay the probability-bar grow-in for every card (e.g. when the
  // Mixed/All-standard match-layout toggle flips). Each card watches this and,
  // on a change, resets its bar back to 0 and re-runs the entrance ramp.
  barResetKey: number;
  registerCard: (id: string, box: CardBox) => void;
  // Shared timestamp (ms) of the last center-highlight haptic, used as a global
  // cooldown so a fast fling across many cards doesn't machine-gun the taptic.
  lastHaptic: RefObject<number>;
};

const ScrollRevealContext = createContext<ScrollReveal>({
  mode: "off",
  centerHighlight: "off",
  reflectTarget: "both",
  present: false,
  scrollY: new Animated.Value(0),
  viewportH: 0,
  contentH: 0,
  topPad: 0,
  contentRef: { current: null },
  cards: { current: new Map() },
  cardsVersion: 0,
  barResetKey: 0,
  registerCard: () => {},
  lastHaptic: { current: 0 },
});

export const ScrollRevealProvider = ScrollRevealContext.Provider;
export const useScrollReveal = () => useContext(ScrollRevealContext);
