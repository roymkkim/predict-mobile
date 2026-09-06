import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/sim/colors";
import type { ReflectTarget } from "@/lib/sim/ScrollRevealContext";

const RADIUS = 12;
const BORDER = 1.5;
const SWEEP_MS = 2200;
const DRIFT_MS = 4200;

// The "light reflect" center-highlight variant. Behaviour depends on `target`:
//
// - "surface" / "both": the card SURFACE gets a very slow, subtle gradient
//   animation — a soft, near-surface-colored highlight that gently drifts back
//   and forth across the body to quietly draw the eye to the focused card. It's
//   intentionally low-contrast (colors barely above the surface) so it reads as
//   a calm shift, not a shimmer.
// - "border": a soft holographic sheen sweeps the rounded border ring ONCE each
//   time the card enters focus (driven by `pulse`) — it does NOT loop.
// - "both": the slow surface drift plus a lit border ring.
//
// The whole overlay's opacity is gated by the scroll-driven `progress` so the
// effect only shows while the card sits near viewport center.
//
// Render as the FIRST child of the card's (overflow-hidden, rounded) root View so
// it paints behind the card content. Renders nothing when progress is null
// (effect off / card not measurable yet).
export function LightReflect({
  progress,
  target,
  pulse = 0,
  radius = RADIUS,
}: {
  progress: Animated.AnimatedInterpolation<number> | null;
  target: ReflectTarget;
  pulse?: number;
  radius?: number;
}) {
  const [w, setW] = useState(0);
  const shimmer = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  const enabled = !!progress;
  const surfaceFx = target === "surface" || target === "both";
  const sweepFx = target === "border";

  // Border sheen: one-shot sweep replayed each time the card (re-)enters focus
  // (pulse changes), and once when the sheen first becomes active.
  useEffect(() => {
    if (!enabled || !sweepFx) return;
    shimmer.setValue(0);
    const anim = Animated.timing(shimmer, {
      toValue: 1,
      duration: SWEEP_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
    // Depend on the stable `enabled`/`sweepFx` rather than `progress` itself:
    // progress's identity churns as the card scrolls (would restart mid-travel).
  }, [pulse, enabled, sweepFx, shimmer]);

  // Surface highlight: a very slow, continuous back-and-forth drift (no hard
  // reset/jump — it eases to each end and reverses), kept subtle on purpose.
  useEffect(() => {
    if (!enabled || !surfaceFx) return;
    drift.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: DRIFT_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: DRIFT_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, surfaceFx, drift]);

  if (!progress) return null;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  // Border sweep band geometry.
  const coreW = Math.max(120, w * 0.62);
  const haloW = coreW * 1.9;
  const tx = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-haloW, w + haloW * 0.5],
  });

  // Surface drift band geometry: a band wider than the card whose soft bright
  // center slides gently from one side to the other while always covering it.
  const driftW = Math.max(w * 1.7, 240);
  const driftTx = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-(driftW - w), 0],
  });

  const maskToBorder = target === "border";
  const showBorder = target !== "surface";

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFillObject, { borderRadius: radius, overflow: "hidden", opacity: progress }]}
    >
      {surfaceFx && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: driftW,
            transform: [{ translateX: driftTx }],
          }}
        >
          {/* Slow, subtle surface highlight — colors sit just above the card
              surface so the drift is felt more than seen. */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.00)",
              "rgba(255,255,255,0.025)",
              "rgba(255,255,255,0.06)",
              "rgba(255,255,255,0.025)",
              "rgba(255,255,255,0.00)",
            ]}
            locations={[0, 0.3, 0.5, 0.7, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      {sweepFx && (
        <Animated.View
          style={{
            position: "absolute",
            top: -140,
            bottom: -140,
            left: 0,
            width: haloW,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: tx }, { rotate: "18deg" }],
          }}
        >
          {/* Wide, very faint halo — the soft bloom that kills the hard edge. */}
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.06)", "transparent"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Narrower soft core with a smooth gaussian-like falloff (no hard stops). */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255,255,255,0.03)",
              "rgba(255,255,255,0.09)",
              "rgba(255,255,255,0.16)",
              "rgba(255,255,255,0.09)",
              "rgba(255,255,255,0.03)",
              "transparent",
            ]}
            locations={[0, 0.22, 0.38, 0.5, 0.62, 0.78, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: coreW, height: "100%" }}
          />
        </Animated.View>
      )}

      {maskToBorder && (
        <View
          style={{
            position: "absolute",
            top: BORDER,
            left: BORDER,
            right: BORDER,
            bottom: BORDER,
            borderRadius: radius - BORDER,
            backgroundColor: colors.surface,
          }}
        />
      )}

      {showBorder && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: radius,
            borderWidth: BORDER,
            borderColor: "rgba(255,255,255,0.28)",
          }}
        />
      )}
    </Animated.View>
  );
}
