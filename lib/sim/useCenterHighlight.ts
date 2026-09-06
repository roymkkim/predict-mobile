import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Animated, type View, type LayoutChangeEvent } from "react-native";
import * as Haptics from "@/lib/sim/haptics";
import { useScrollReveal, type ReflectTarget } from "./ScrollRevealContext";

// Drives the "center highlight" effect for a single card. Attach the returned
// `rootRef`/`onLayout` to the card's root View; the hook measures the card's
// offset + height within the shared scroll content (same pattern as LiveBorder)
// and interpolates the shared scrollY into a button-background opacity that
// lights the card while the viewport-center line sweeps across its body and
// lingers briefly past it. Each card caps its lit window against the next card
// below (via the shared registry) so focus stays on exactly one card at a time —
// no two cards are ever highlighted simultaneously. Returns null when the toggle
// is off or the card isn't measurable yet, so consumers render nothing.
export type CenterHighlight = {
  rootRef: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
  // White button-face opacity — non-null only for the "face" variant.
  bgOpacity: Animated.AnimatedInterpolation<number> | null;
  // Holographic-sheen progress (0..1) — non-null only for the "reflect" variant.
  reflectOpacity: Animated.AnimatedInterpolation<number> | null;
  reflectTarget: ReflectTarget;
  // Bumps each time the card (re-)enters the focus window, so the reflect sheen
  // can fire a single sweep per entry instead of looping.
  reflectPulse: number;
  // Probability-bar width driver. Pinned at 1 (bars render pre-loaded at full
  // width) everywhere — the scroll-into-view grow-in animation is disabled.
  barProgress: Animated.Value;
};

export function useCenterHighlight(): CenterHighlight {
  const reveal = useScrollReveal();
  const id = useId();
  const rootRef = useRef<View>(null);
  const [cardY, setCardY] = useState<number | null>(null);
  const [cardH, setCardH] = useState(0);

  // Measure offset + height within the scroll content and publish to the shared
  // registry. Run on every layout (cheap, keeps the offset fresh across
  // density/footer shifts) and again when the toggle flips on after mount —
  // otherwise toggling it on without a relayout would leave cardY null.
  const { contentRef, registerCard } = reveal;
  const measure = useCallback(() => {
    if (contentRef.current && rootRef.current) {
      rootRef.current.measureLayout(
        contentRef.current,
        (_x, y, _w, h) => {
          setCardY(y);
          setCardH(h);
          registerCard(id, { y, h });
        },
        () => {},
      );
    }
  }, [contentRef, registerCard, id]);

  const onLayout = (_e: LayoutChangeEvent) => {
    measure();
  };

  useEffect(() => {
    if (reveal.centerHighlight !== "off") measure();
  }, [reveal.centerHighlight, reveal.viewportH, measure]);

  // Probability bars render pre-loaded at full width — the scroll-into-view
  // grow-in animation is disabled, so this stays pinned at 1 for every card.
  const barProgress = useRef(new Animated.Value(1)).current;

  const can = reveal.centerHighlight !== "off" && cardY != null && reveal.viewportH > 0 && cardH > 0;

  // Edge fade distance: smooth ramp at each end of the lit window.
  const edge = useMemo(() => Math.min(80, cardH * 0.45), [cardH]);

  // scrollY thresholds for the lit window. We compute them eagerly (not only
  // inside the interpolation memo) so the haptic listener can reuse them.
  const win = useMemo(() => {
    if (!can || cardY == null) return null;
    // scrollY values where the viewport center hits the card's top / bottom.
    const sTop = reveal.topPad + cardY - reveal.viewportH / 2;
    const sBottom = reveal.topPad + cardY + cardH - reveal.viewportH / 2;
    // Linger: hold white through the card and ~10% of screen height past its
    // bottom, so the white doesn't drop the moment the card leaves center.
    const hold = reveal.viewportH * 0.1;
    // Find the next card below this one (smallest y greater than ours). Cap the
    // lingering hold so this card's fade-out finishes before the next card's
    // fade-in begins — guaranteeing only one card is ever mid-highlight.
    let nextY = Infinity;
    for (const box of reveal.cards.current.values()) {
      if (box.y > cardY + 0.5 && box.y < nextY) nextY = box.y;
    }
    let fullEnd = sBottom + hold;
    if (nextY !== Infinity) {
      const sNextTop = reveal.topPad + nextY - reveal.viewportH / 2;
      // Next card starts fading in at sNextTop; our fade-out (length `edge`)
      // must end by then.
      fullEnd = Math.min(fullEnd, sNextTop - edge);
    }
    // Keep the window strictly increasing even if the cap pulls fullEnd back.
    fullEnd = Math.max(fullEnd, sTop + edge + 1);
    return { sTop, fullEnd };
    // reveal.cardsVersion drives recompute when neighbours (re)register.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [can, cardY, cardH, reveal.topPad, reveal.viewportH, edge, reveal.cardsVersion]);

  // Shared 0..1 focus progress: ramps up as the card enters center, holds, then
  // ramps back out. Reused by both the "face" (white button bg) and "reflect"
  // (holographic sheen) variants.
  const progress = useMemo(() => {
    if (!win) return null;
    return reveal.scrollY.interpolate({
      inputRange: [win.sTop, win.sTop + edge, win.fullEnd, win.fullEnd + edge],
      outputRange: [0, 1, 1, 0],
      extrapolate: "clamp",
    });
  }, [win, edge, reveal.scrollY]);

  const mode = reveal.centerHighlight;
  const bgOpacity = mode === "face" ? progress : null;
  const reflectOpacity = mode === "reflect" ? progress : null;

  // One-shot trigger for the reflect sweep: bumped on each entry into focus.
  const [reflectPulse, setReflectPulse] = useState(0);

  // Haptic: a light tap as the white fades in. Fire once when the scroll crosses
  // the mid-point of this card's fade-in ramp (downward entry into focus), and
  // re-arm once the card has fully left the lit window so the next pass taps
  // again. No-op on web (expo-haptics is silent there).
  useEffect(() => {
    if (!win) return;
    const threshold = win.sTop + edge * 0.5;
    let armed = true;
    const sub = reveal.scrollY.addListener(({ value }) => {
      if (armed && value >= threshold && value <= win.fullEnd) {
        armed = false;
        // Kick off a single reflect sweep for this entry into focus.
        setReflectPulse((p) => p + 1);
        // Global cooldown so a fast fling across many cards doesn't machine-gun.
        const now = Date.now();
        if (now - reveal.lastHaptic.current >= 140) {
          reveal.lastHaptic.current = now;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      } else if (value < win.sTop || value > win.fullEnd + edge) {
        armed = true;
      }
    });
    return () => reveal.scrollY.removeListener(sub);
  }, [win, edge, reveal.scrollY, reveal.lastHaptic]);

  return { rootRef, onLayout, bgOpacity, reflectOpacity, reflectTarget: reveal.reflectTarget, reflectPulse, barProgress };
}
