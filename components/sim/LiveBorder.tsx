import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import * as Haptics from "@/lib/sim/haptics";
import { useLiveCueColors } from "@/lib/sim/LiveCueColorContext";
import { useScrollReveal } from "@/lib/sim/ScrollRevealContext";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { getGlowBreathOpacity } from "@/lib/sim/breath";
import type { BorderCuePlacement } from "@/lib/sim/types";
import { useUxrMode } from "@/lib/sim/uxrModeStore";

// "Border" live cue: a 1px ring around the whole card that glows the live-cue
// color and fades into a neutral white hairline around the rest of the card.
// Faithful RN port of the web's radial-gradient mask border — an SVG rounded
// rect stroke whose paint is a radial (ellipse) gradient, layered over a flat
// white hairline stroke so the glow sums over neutral exactly like the web.
//
// - "left": a circular glow (equal 90px reach across and down) anchored at the
//   top-left corner (where the live clock sits) — brightest top-left, fading out
//   the same distance along the top edge and down the left edge so the two arms
//   read as visually equal.
// - "center": ellipse ~55% of the card width, 90px tall, anchored top-center —
//   a glowing line centered on the top edge fading symmetrically to both ends.
//
// When the "reveal on scroll" setting is on, the accent glow is driven by the
// shared scroll offset. For left placement the corner lights up first (fast
// opacity ramp), then TWO arms sweep out from the top-left corner in sync — one
// rightward along the top edge (scaleX), one down the left edge (scaleY) — each
// clipped to its edge band so it stays glued to the real card edge. Per-axis
// scaling reads as two directional sweeps rather than one diagonal zoom.
const RADIUS = 12;
const INSET = 0.5; // keep the 1px stroke fully inside the card bounds
// Corner-accent reach (px) from the lit corner before it fades to the neutral
// hairline. Kept short so the glow hugs the corner (matches the design) rather
// than running far down the edges.
const GLOW_RY = 48;
// Full-top center mode wraps the glow DOWN both corners, so it needs a taller
// vertical reach than the default center/left modes (whose down-extent is tied
// to GLOW_RY). Kept local to the full-top gradient so it never affects the
// left-placement arm geometry.
const FULL_TOP_RY = 76;
// Card has revealed once its top sits this fraction of the viewport below the
// top edge. Higher = the glow finishes sooner (less scroll needed) so it lands
// "a little earlier" and so late cards can still complete before scroll bottoms.
const SETTLE_FRAC = 0.6;
// Reveal doesn't begin the instant the card peeks in at the bottom edge — it
// starts once the card's top has risen this fraction of the viewport below the
// top edge (i.e. ~1/4 of the screen up from the bottom), so the glow kicks in a
// bit after the card is clearly on screen.
const ENTER_FRAC = 0.75;
// Each arm starts this short (seeded at the corner) and sweeps out to full.
const ARM_START = 0.1;
// Center placement: how wide the accent starts (fraction of full width) before
// growing outward from the card center as it reveals.
const CENTER_START = 0.3;
// Edge-band thickness: each arm is clipped to a band hugging its edge so it
// stays glued to the real card edge while it sweeps (and so the top arm doesn't
// reveal the whole left arm, or vice versa). A little wider than the corner.
const ARM_BAND = RADIUS + 8;
// Fixed corner piece size. The corner box owns the border from (0,0) out to
// CORNER_BOX (covering the rounded arc + a short straight stub); the arms start
// EXACTLY at CORNER_BOX. Partitioning the border this way (no overlap) means no
// pixel is painted by two layers, which is what previously summed into visible
// bright "dots" where an arm crossed the corner box. Must be > RADIUS so the
// whole arc lives in the (un-scaled) corner piece.
const CORNER_BOX = RADIUS + 2;
// Place the left-placement glow peak on the rounded-corner arc (~RADIUS*0.55 in
// from the geometric corner) so it isn't lost in the clipped corner notch.
const CORNER_ANCHOR = RADIUS * 0.55;
// Left-placement top-arm reach. Kept EQUAL to the vertical reach (GLOW_RY) so the
// radial falloff is circular, not elliptical — otherwise a shorter horizontal
// reach makes the top arm fade faster/shorter than the left arm and the two read
// as visually unequal. Equal reach = the top and left accents match in length and
// brightness at any given distance from the corner.
const LEFT_GLOW_RX = GLOW_RY;

// Unique gradient id per SVG instance — two arms each render their own <Svg>, so
// they must not share a gradient id (duplicate ids collide on web/SVG).
let GID_SEQ = 0;

type LiveBorderProps = { placement?: BorderCuePlacement; color?: string; radius?: number; live?: boolean; centerWide?: boolean; glowAnchor?: "left" | "center" };

// UXR mode drops the glow accent line entirely across all cards. Wrapper (not
// an early return inside the inner component) so the inner component's hooks
// unmount cleanly when the mode toggles while cards are mounted.
export function LiveBorder(props: LiveBorderProps) {
  if (useUxrMode() === "uxr") return null;
  return <LiveBorderInner {...props} />;
}

function LiveBorderInner({ placement = "left", color, radius = RADIUS, live = false, centerWide = false, glowAnchor }: LiveBorderProps) {
  const cue = useLiveCueColors();
  // Allow callers to override the accent color (e.g. standard cards use white
  // instead of the live-cue color). Defaults to the contextual live-cue color.
  const strokeColor = color ?? cue.color;
  const reveal = useScrollReveal();
  // Whether THIS border participates in the scroll reveal: "all" reveals every
  // accent, "live" reveals only live-game cards (which pass `live`), "off" none.
  const revealEnabled = reveal.mode === "all" || (reveal.mode === "live" && live);
  // Regular (non-live) cards only show their white accent when it actually
  // reveals on scroll (mode "all"). When reveal isn't on for this card, drop the
  // accent glow entirely — the neutral hairline below still gives the card its
  // border. Live cards keep their cue accent in every mode (it's the live cue).
  const suppressAccent = !live && !revealEnabled;
  // Subtle inward bloom: only on the live cue accent, in the live-cue color.
  const { innerGlow, accentOpacity: rawAccentOpacity } = useFeedSettings();
  const accentOpacity = Math.max(0, Math.min(1, rawAccentOpacity));
  const showInnerGlow = innerGlow && live && !suppressAccent;
  // Shared breath clock: the glow's opacity fades in and out at the same pace as
  // the live dot but trails it by GLOW_LAG_MS (deliberately not perfectly in-sync).
  const breathGlowOpacity = getGlowBreathOpacity();
  const wrapperRef = useRef<View>(null);
  const gidBase = useRef(`lbg${GID_SEQ++}`).current;
  // JS-driven 0..1->width-fraction value for the full-top center reveal (see the
  // masked-window effect/render below). Layout (clip) width can't ride the
  // native-driven scrollY, so we drive this off a scroll listener instead.
  const maskProgress = useRef(new Animated.Value(0)).current;
  // Latest scroll offset, kept fresh by the per-card scroll listener below. The
  // native-driven scrollY has no synchronously-readable JS value, so we cache it
  // here to seed the full-top mask correctly when its effect re-runs mid-scroll
  // (e.g. flipping the accent setting while the feed is already scrolled).
  const lastScrollRef = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [cardY, setCardY] = useState<number | null>(null);

  // Measure this card's offset within the scroll content. Run on every layout
  // (cheap, and keeps the offset fresh across density/size shifts) and again
  // when the reveal toggle flips on after mount — otherwise toggling reveal on
  // without a relayout would leave cardY null and the border static.
  const measure = useCallback(() => {
    if (reveal.contentRef.current && wrapperRef.current) {
      wrapperRef.current.measureLayout(
        reveal.contentRef.current,
        (_x, y) => setCardY(y),
        () => {},
      );
    }
  }, [reveal.contentRef]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
    measure();
  };

  useEffect(() => {
    if (revealEnabled) measure();
  }, [revealEnabled, reveal.viewportH, measure]);

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const isCenter = placement === "center";
  // The inner bloom (background gradient) anchor is decoupled from the accent
  // ring placement: cards with a left-aligned timestamp/live cue (StandardCard)
  // keep the bloom in the left corner even when the accent ring is centered.
  // Defaults to following the ring placement when glowAnchor isn't given.
  const bloomCenter = glowAnchor ? glowAnchor === "center" : isCenter;
  // For left placement, seat the gradient peak on the rounded-corner arc rather
  // than at (0,0): that geometric corner is the notch the card's overflow:hidden
  // + borderRadius clips away, so a peak there leaves the visible stroke dim.
  const cx = isCenter ? w / 2 : CORNER_ANCHOR;
  const cy = isCenter ? 0 : CORNER_ANCHOR;
  // Center default: fade to zero where the top straight edge meets the rounded
  // corner (rx = half-width minus corner radius) so the accent never paints the
  // corner arcs. Center "wide"/full-top: push rx out to the FULL card width so
  // the whole top edge sits inside the gradient's bright "hold" band (see the
  // stops below) and the glow wraps DOWN into both corners (faded out via ry)
  // instead of dying right at the corner like the half-width default did.
  const fullTop = isCenter && centerWide;
  // Full-top: push rx PAST the card width (1.25w) so each corner (at x = w/2)
  // lands well inside the bright "hold" band, then wraps DOWN the side edges
  // before fading — at rx = w the corner sat right at 0.5 of rx, so the glow
  // died at the corner instead of curving around it.
  const rx = isCenter ? (fullTop ? w * 1.25 : Math.max(0, w / 2 - radius)) : Math.min(LEFT_GLOW_RX, w);
  const gradRy = fullTop ? FULL_TOP_RY : GLOW_RY;

  const canReveal = revealEnabled && cardY != null && reveal.viewportH > 0;
  const revealStyle = useMemo(() => {
    if (!canReveal || cardY == null) return null;
    const enter = reveal.topPad + cardY - reveal.viewportH * ENTER_FRAC; // card top ~1/4 up from bottom
    let settled = reveal.topPad + cardY - reveal.viewportH * SETTLE_FRAC; // card top ~SETTLE up
    // Cap completion at the deepest reachable scroll so the last cards (which can
    // never scroll up to the settle point) still finish revealing as you bottom out.
    const maxScroll = Math.max(0, reveal.contentH - reveal.viewportH);
    if (maxScroll > 0) settled = Math.min(settled, maxScroll);
    if (settled <= enter) settled = enter + 1;
    const range: [number, number] = [enter, settled];
    // Light the corner up early-ish (opacity hits full ~halfway through the
    // travel) so it still reads as the corner glowing FIRST, then the accent
    // spreads — but the fade-in takes a bit more scroll to complete.
    const mid = enter + (settled - enter) * 0.5;
    const opacity = reveal.scrollY.interpolate({
      inputRange: [enter, mid, settled],
      outputRange: [0, 1, 1],
      extrapolate: "clamp",
    });
    if (isCenter) {
      // Centered accent animation: the glow grows outward from the card's
      // center (scaleX anchored at center, RN scales about the view center) as
      // it fades in, so the accent reads as spreading out from the middle.
      //
      // EXCEPTION: full-top mode lights the whole top edge AND wraps the bright
      // stroke down into BOTH corners + upper sides. scaleX-squishing that lit
      // perimeter pulls the side/corner strokes together into a narrowing
      // rounded-rectangle outline — the "ghost rectangle" that expands outward.
      // (A true center-out wipe would need a layout-width clip, which isn't
      // possible here because scrollY is native-driven.) So full-top reveals
      // with opacity only (scaleX held at 1) — it fades in cleanly with no box.
      const centerScaleX: number | Animated.AnimatedInterpolation<number> = fullTop
        ? 1
        : reveal.scrollY.interpolate({
            inputRange: range,
            outputRange: [CENTER_START, 1],
            extrapolate: "clamp",
          });
      return { opacity, isCenter: true as const, centerTransform: [{ scaleX: centerScaleX }] };
    }
    // Left placement: TWO simultaneous arms emanating from the top-left corner —
    // one sweeping RIGHT along the top edge, one sweeping DOWN the left edge. Each
    // arm covers ONLY the STRAIGHT part of its edge (from the corner arc's end at
    // RADIUS outward) and is revealed by a single-axis scale ANCHORED AT THE
    // CORNER END of that edge. Anchoring at the corner end (not the (0,0) notch)
    // keeps the arm's first pixel pinned at the corner with constant brightness,
    // so the line grows smoothly OUT of the lit corner with no visible seam — and
    // because the arc itself lives in the fixed corner piece, scaling never
    // squishes it. RN scales about the band center, so translate back by
    // (bandExtent/2)*(1-s) to pin the corner end. Both run over the same range.
    const armScale = reveal.scrollY.interpolate({
      inputRange: range,
      outputRange: [ARM_START, 1],
      extrapolate: "clamp",
    });
    const topTranslateX = reveal.scrollY.interpolate({
      inputRange: range,
      outputRange: [-((w - CORNER_BOX) / 2) * (1 - ARM_START), 0],
      extrapolate: "clamp",
    });
    const leftTranslateY = reveal.scrollY.interpolate({
      inputRange: range,
      outputRange: [-((GLOW_RY - CORNER_BOX) / 2) * (1 - ARM_START), 0],
      extrapolate: "clamp",
    });
    return {
      opacity,
      isCenter: false as const,
      topTransform: [{ translateX: topTranslateX }, { scaleX: armScale }],
      leftTransform: [{ translateY: leftTranslateY }, { scaleY: armScale }],
    };
  }, [canReveal, cardY, reveal.topPad, reveal.viewportH, reveal.contentH, reveal.scrollY, isCenter, fullTop, w]);

  // Haptic: a light tap as the accent reveals in. Mirrors the reveal window used
  // above — fires once when the scroll crosses the midpoint of this card's
  // fade-in (where the accent reaches full brightness), throttled by the shared
  // cooldown so a fast fling across many cards doesn't machine-gun the taptic.
  // Re-arms only after scrolling back above the card's enter point. No-op on web.
  useEffect(() => {
    if (!canReveal || cardY == null) return;
    const enter = reveal.topPad + cardY - reveal.viewportH * ENTER_FRAC;
    let settled = reveal.topPad + cardY - reveal.viewportH * SETTLE_FRAC;
    const maxScroll = Math.max(0, reveal.contentH - reveal.viewportH);
    if (maxScroll > 0) settled = Math.min(settled, maxScroll);
    if (settled <= enter) settled = enter + 1;
    const threshold = enter + (settled - enter) * 0.5;
    let armed = true;
    const sub = reveal.scrollY.addListener(({ value }) => {
      lastScrollRef.current = value;
      if (armed && value >= threshold && value <= settled) {
        armed = false;
        const now = Date.now();
        if (now - reveal.lastHaptic.current >= 140) {
          reveal.lastHaptic.current = now;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      } else if (value < enter) {
        armed = true;
      }
    });
    return () => reveal.scrollY.removeListener(sub);
  }, [canReveal, cardY, reveal.topPad, reveal.viewportH, reveal.contentH, reveal.scrollY, reveal.lastHaptic]);

  // Full-top center reveal: drive a JS Animated.Value from the scroll offset so
  // the clip window (a LAYOUT width, which can't ride the native scrollY) can
  // widen from the card center out to both corners. We map the same enter/settle
  // window the opacity uses into a width FRACTION (CENTER_START -> 1) and seed it
  // at scrollY 0 (the page rests at the top on mount, same assumption as the bar
  // grow-in). Inert unless full-top + reveal are both active.
  useEffect(() => {
    if (!fullTop || !canReveal || cardY == null) return;
    const enter = reveal.topPad + cardY - reveal.viewportH * ENTER_FRAC;
    let settled = reveal.topPad + cardY - reveal.viewportH * SETTLE_FRAC;
    const maxScroll = Math.max(0, reveal.contentH - reveal.viewportH);
    if (maxScroll > 0) settled = Math.min(settled, maxScroll);
    if (settled <= enter) settled = enter + 1;
    const toFrac = (v: number) => {
      const p = Math.max(0, Math.min(1, (v - enter) / (settled - enter)));
      return CENTER_START + (1 - CENTER_START) * p;
    };
    // Seed from the last-known scroll offset (0 on a fresh top-of-feed mount,
    // the real position if this effect re-runs mid-scroll) so the mask starts at
    // the correct width with no flash, then track live updates.
    maskProgress.setValue(toFrac(lastScrollRef.current));
    const sub = reveal.scrollY.addListener(({ value }) => {
      lastScrollRef.current = value;
      maskProgress.setValue(toFrac(value));
    });
    return () => reveal.scrollY.removeListener(sub);
  }, [fullTop, canReveal, cardY, reveal.topPad, reveal.viewportH, reveal.contentH, reveal.scrollY, maskProgress]);

  // Clip-window geometry for the full-top reveal: a centered window whose width
  // grows from CENTER_START*w (at enter) to the full card width w (at settle) —
  // maskProgress carries the width FRACTION, so [0,1]->[0,w] maps it to px. The
  // full-size accent is pinned inside via a counter offset (innerLeft =
  // -windowLeft) so the accent never scales/squishes — the
  // reveal is a pure center->corners wipe, not a stretched "ghost rectangle".
  const maskW = useMemo(
    () => maskProgress.interpolate({ inputRange: [0, 1], outputRange: [0, w], extrapolate: "clamp" }),
    [maskProgress, w],
  );
  const maskLeft = useMemo(
    () => maskProgress.interpolate({ inputRange: [0, 1], outputRange: [w / 2, 0], extrapolate: "clamp" }),
    [maskProgress, w],
  );
  const maskInnerLeft = useMemo(
    () => maskProgress.interpolate({ inputRange: [0, 1], outputRange: [-w / 2, 0], extrapolate: "clamp" }),
    [maskProgress, w],
  );

  // Gradient stops for the accent ring. Full-top mode inserts a "hold" stop so
  // the bright color stays at full strength across the whole top edge (each
  // corner sits at ~0.5 of rx since rx = full width) before fading down into
  // the corners; other modes fade linearly from center to edge.
  const accentStops = [
    <Stop key="0" offset="0" stopColor={strokeColor} stopOpacity={accentOpacity} />,
    ...(fullTop
      ? [<Stop key="hold" offset="0.6" stopColor={strokeColor} stopOpacity={accentOpacity} />]
      : []),
    <Stop key="1" offset="1" stopColor={strokeColor} stopOpacity={0} />,
  ];

  // The accent is the full radial-gradient rounded-rect stroke. It is rendered
  // once for the resting/center case, and twice (once per arm) for the left-
  // placement reveal — so each instance needs its own gradient id.
  const makeAccent = (gid: string, ox = 0, oy = 0) => (
    <Svg width={w} height={h} style={{ position: "absolute", left: ox, top: oy }}>
      <Defs>
        <RadialGradient
          id={gid}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={gradRy}
          gradientUnits="userSpaceOnUse"
        >
          {accentStops}
        </RadialGradient>
      </Defs>
      <Rect
        x={INSET}
        y={INSET}
        width={w - INSET * 2}
        height={h - INSET * 2}
        rx={radius - INSET}
        ry={radius - INSET}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={0.6}
      />
    </Svg>
  );

  return (
    <View
      ref={wrapperRef}
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {size && w > 0 && h > 0 && (
        <>
          {/* subtle inward bloom: a soft radial fill anchored at the lit edge
              that bleeds into the card interior (clipped by the card's rounded
              overflow). Painted first so the ring + content sit on top. */}
          {showInnerGlow && (() => {
            const bloom = (
              <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
                <Defs>
                  <RadialGradient
                    id={`${gidBase}-glow`}
                    cx={bloomCenter ? w / 2 : CORNER_ANCHOR}
                    cy={0}
                    rx={bloomCenter ? w * 0.52 : w * 0.62}
                    ry={h * 0.5}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor={strokeColor} stopOpacity={0.12} />
                    <Stop offset="0.55" stopColor={strokeColor} stopOpacity={0.036} />
                    <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={w} height={h} fill={`url(#${gidBase}-glow)`} />
              </Svg>
            );
            // The glow breathes: its opacity fades in and out on the shared breath
            // clock, in lockstep with the live dot.
            const breathed = (
              <Animated.View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: breathGlowOpacity }}
              >
                {bloom}
              </Animated.View>
            );
            // When the accent reveals on scroll, fade the bloom in with the same
            // opacity ramp so it never appears before the ring it belongs to.
            return revealStyle ? (
              <Animated.View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: revealStyle.opacity }}
              >
                {breathed}
              </Animated.View>
            ) : (
              breathed
            );
          })()}
          {/* neutral hairline around the whole card */}
          <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
            <Rect
              x={INSET}
              y={INSET}
              width={w - INSET * 2}
              height={h - INSET * 2}
              rx={radius - INSET}
              ry={radius - INSET}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          </Svg>
          {/* live-cue glow, summed over the neutral hairline */}
          {suppressAccent ? null : !revealStyle ? (
            // Reveal off (or not measurable): rest at the full glow.
            makeAccent(gidBase)
          ) : revealStyle.isCenter && fullTop ? (
            // Full-top center: a TRUE center->corners reveal. A centered window
            // (overflow:hidden) widens from the middle out to both corners while
            // the full-size accent is pinned inside via a counter offset, so the
            // accent itself is never scaled — the lit top edge + corners are
            // simply uncovered from the center outward, with no "ghost rectangle".
            // Opacity (native) lives on the outer view; the window width/left and
            // the inner counter-offset (JS) live on the inner views, so no single
            // view mixes the native and JS drivers.
            <Animated.View
              style={[
                { position: "absolute", left: 0, top: 0, width: w, height: h },
                { opacity: revealStyle.opacity },
              ]}
            >
              <Animated.View
                style={{ position: "absolute", top: 0, height: h, overflow: "hidden", width: maskW, left: maskLeft }}
              >
                <Animated.View style={{ position: "absolute", top: 0, height: h, width: w, left: maskInnerLeft }}>
                  {makeAccent(gidBase)}
                </Animated.View>
              </Animated.View>
            </Animated.View>
          ) : revealStyle.isCenter ? (
            // Center placement (half-width): fade the single glow in while it
            // grows outward from the card center (scaleX) so it spreads from the
            // middle. (Full-width uses the clip-window wipe above instead.)
            <Animated.View
              style={[
                { position: "absolute", left: 0, top: 0, width: w, height: h },
                { opacity: revealStyle.opacity, transform: revealStyle.centerTransform },
              ]}
            >
              {makeAccent(gidBase)}
            </Animated.View>
          ) : (
            // Left placement: two arms sweeping out from the top-left corner —
            // RIGHT along the top edge, DOWN the left edge. Each arm covers ONLY
            // the straight part of its edge (offset to start at CORNER_BOX) and
            // is anchored at that corner end, so its first pixel stays pinned to
            // the lit corner and the line grows smoothly outward with no seam.
            <>
              <Animated.View
                style={{
                  position: "absolute",
                  left: CORNER_BOX,
                  top: 0,
                  width: Math.max(0, w - CORNER_BOX),
                  height: ARM_BAND,
                  overflow: "hidden",
                  opacity: revealStyle.opacity,
                  transform: revealStyle.topTransform,
                }}
              >
                {makeAccent(`${gidBase}-t`, -CORNER_BOX, 0)}
              </Animated.View>
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  top: CORNER_BOX,
                  width: ARM_BAND,
                  height: Math.max(0, GLOW_RY - CORNER_BOX),
                  overflow: "hidden",
                  opacity: revealStyle.opacity,
                  transform: revealStyle.leftTransform,
                }}
              >
                {makeAccent(`${gidBase}-l`, 0, -CORNER_BOX)}
              </Animated.View>
              {/* Fixed corner: paints the rounded-corner ARC only (the part the
                  arms exclude). Un-scaled, opacity-fade only, so the arc never
                  squishes into the clipped (0,0) notch. It abuts the arm starts
                  (also CORNER_BOX) with no overlap, so the join is gap-free and
                  never double-painted. Drawn last. */}
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: CORNER_BOX,
                  height: CORNER_BOX,
                  overflow: "hidden",
                  opacity: revealStyle.opacity,
                }}
              >
                {makeAccent(`${gidBase}-c`)}
              </Animated.View>
            </>
          )}
        </>
      )}
    </View>
  );
}
