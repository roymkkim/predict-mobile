import { Animated, Easing, Platform } from "react-native";

// Shared "breathing" clock for the live cues — the live dot and the border glow.
// Two module-level Animated.Values loop 0 -> 1 over the SAME period so both cues
// breathe at the same pace, but the glow clock starts GLOW_LAG_MS later so the
// glow trails the dot pulse by a constant lag (the user wanted them not perfectly
// in-sync). Keeping them at module scope (instead of per-component loops) means
// the phase relationship is fixed app-wide with no prop drilling. Consumers read
// getBreathOpacity() (dot) / getGlowBreathOpacity() (glow) so the fade envelope
// lives in exactly one place.
//
// The cycle is an explicit 4s trapezoid (linear clock, so equal time = equal t):
//   fade in 1s -> hold full 1s -> fade out 1s -> hold faded-out 1s -> loop.
export const BREATH_MS = 4000;
// The glow breathes this many ms behind the dot pulse — a deliberate small lag so
// the two cues read as related but not robotically in-sync.
export const GLOW_LAG_MS = 50;

const dot = new Animated.Value(0);
const glow = new Animated.Value(0);
let started = false;
// Expo web does not have the native animated module. Use the JS driver there so
// the shared live-dot clock keeps advancing instead of parking at its first frame.
const useNativeDriver = Platform.OS !== "web";

function ensureStarted() {
  if (started) return;
  started = true;
  Animated.loop(
    Animated.timing(dot, {
      toValue: 1,
      duration: BREATH_MS,
      easing: Easing.linear,
      useNativeDriver,
    }),
  ).start();
  // Same loop, started GLOW_LAG_MS later — so glow's phase always trails dot's by
  // exactly that lag once running.
  Animated.sequence([
    Animated.delay(GLOW_LAG_MS),
    Animated.loop(
      Animated.timing(glow, {
        toValue: 1,
        duration: BREATH_MS,
        easing: Easing.linear,
        useNativeDriver,
      }),
    ),
  ]).start();
}

// The single opacity envelope every live cue breathes on. Each quarter of the
// cycle is one second: 0->0.25 fade in (0->1), 0.25->0.5 hold full, 0.5->0.75
// fade out (1->0), 0.75->1 hold faded out.
function envelope(v: Animated.Value) {
  return v.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 1, 1, 0, 0],
  });
}

// Minimum opacity the live DOT fades to. Crucially > 0 so the dot can never fully
// vanish. On Expo web there's no native driver, so the loop runs as a JS rAF loop
// that can stall when the tab is backgrounded or the JS thread is busy; if it
// stalled in the fade-out/hold-at-zero tail (clock parked near the cycle end with
// the plain `envelope`, which maps to 0), the dot would stay invisible forever.
// Flooring keeps it visible at rest. Same SHAPE/phase as `envelope`, so the dot's
// coupling to the border glow (which trails by GLOW_LAG_MS) is unchanged.
const DOT_MIN_OPACITY = 0.4;
function dotEnvelope(v: Animated.Value) {
  return v.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [DOT_MIN_OPACITY, 1, 1, DOT_MIN_OPACITY, DOT_MIN_OPACITY],
  });
}

// The border GLOW has the exact same Expo-web stall problem as the dot: with the
// plain `envelope` it parks at 0 in the fade-out/hold tail and the inner bloom
// disappears entirely (the steady accent ring keeps showing, so only the soft
// bloom vanishes). Floor it just like the dot so the bloom can never get stuck
// fully invisible. Kept a touch higher than the dot floor because the bloom
// gradient is already very faint, so it needs more resting opacity to read.
const GLOW_MIN_OPACITY = 0.5;
function glowEnvelope(v: Animated.Value) {
  return v.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [GLOW_MIN_OPACITY, 1, 1, GLOW_MIN_OPACITY, GLOW_MIN_OPACITY],
  });
}

// Live dot pulse (leads). Floored so it never fully disappears (see above).
export function getBreathOpacity() {
  ensureStarted();
  return dotEnvelope(dot);
}

// Border glow breathing (trails the dot by GLOW_LAG_MS). Floored so the inner
// bloom never gets stuck fully invisible if the web rAF clock parks at the tail.
export function getGlowBreathOpacity() {
  ensureStarted();
  return glowEnvelope(glow);
}
