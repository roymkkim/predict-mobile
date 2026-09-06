// iOS sheet motion vocabulary (from the ios-sheet-motion skill), mapped to RN
// Animated. One driver per property; springs for things that arrive, tweens
// for exits (springs on exit read floppy). Values are authoritative — do not
// retune per sheet:
//   Sheet enter   spring stiffness 540 / damping 55 (overdamped — no overshoot)
//   Sheet exit    tween 0.28s, ease cubic-bezier(0.32, 0.72, 0, 1)
//   Detent enter  tween 0.32s, same ease (compact/child sheets, small menus)
//   Sheet height  tween 0.45s, ease cubic-bezier(0.16, 1, 0.3, 1) (expo-out)
//   Backdrop fade 0.2s in and out
import { Animated, Easing, PanResponder } from "react-native";

import { sheetHeaderDismissAfterStretch, sheetHeaderStretchFromDy, sheetHeaderStretchSnap } from "./comboSheetStretch";

// Standard iOS sheet ease — used for every exit and for detent enters.
export const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1);

export function sheetEnter(v: Animated.Value, useNativeDriver = true) {
  return Animated.spring(v, {
    toValue: 1,
    stiffness: 540,
    damping: 55,
    mass: 1,
    useNativeDriver,
  });
}

export function sheetExit(v: Animated.Value, useNativeDriver = true) {
  return Animated.timing(v, {
    toValue: 0,
    duration: 280,
    easing: SHEET_EASE,
    useNativeDriver,
  });
}

export function detentEnter(v: Animated.Value, useNativeDriver = true) {
  return Animated.timing(v, {
    toValue: 1,
    duration: 320,
    easing: SHEET_EASE,
    useNativeDriver,
  });
}

// Expo-out ease for height resizes — the sheet glides to fit new content.
export const RESIZE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Height is layout, so this driver can never be native.
export function sheetResize(v: Animated.Value, toValue: number) {
  return Animated.timing(v, {
    toValue,
    duration: 450,
    easing: RESIZE_EASE,
    useNativeDriver: false,
  });
}

export function backdropIn(v: Animated.Value, useNativeDriver = true) {
  return Animated.timing(v, { toValue: 1, duration: 200, useNativeDriver });
}

export function backdropOut(v: Animated.Value, useNativeDriver = true) {
  return Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver });
}

// Shared-element morph (FAB ↔ sheet). Snappy underdamped spring — high
// stiffness so it arrives fast, damping ratio ~0.7 for one short bounce.
export function sheetMorph(v: Animated.Value, toValue: number) {
  return Animated.spring(v, {
    toValue,
    stiffness: 1200,
    damping: 38,
    mass: 0.65,
    restDisplacementThreshold: 0.2,
    restSpeedThreshold: 0.2,
    useNativeDriver: false,
  });
}

/** Vertical-only header grab. Ignores mostly-horizontal pans (amount ↔ list). */
export const SHEET_HEADER_DISMISS_DY = 64;
export const SHEET_HEADER_DISMISS_VY = 0.9;

export function snapSheetDragY(dragY: Animated.Value, duration = 220) {
  return Animated.timing(dragY, {
    toValue: 0,
    duration,
    easing: SHEET_EASE,
    useNativeDriver: true,
  });
}

export type SheetHeaderStretch = {
  get: () => number;
  max: () => number;
  set: (next: number) => void;
  snap?: (next: number) => void;
  onUpward?: () => void;
};

export function createSheetHeaderPan(opts: {
  dragY: Animated.Value;
  onDismiss: () => void;
  enabled?: () => boolean;
  stretch?: SheetHeaderStretch;
}) {
  let startStretch = 0;
  const armed = () => opts.enabled?.() ?? true;
  const vertical = (dy: number, dx: number, min: number, dxMul: number) => {
    if (!armed()) return false;
    if (Math.abs(dy) <= Math.abs(dx) * dxMul) return false;
    return opts.stretch ? Math.abs(dy) > min : dy > min;
  };
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => vertical(g.dy, g.dx, 6, 1),
    onMoveShouldSetPanResponderCapture: (_e, g) => vertical(g.dy, g.dx, 12, 1.25),
    onPanResponderGrant: () => {
      startStretch = opts.stretch?.get() ?? 0;
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_e, g) => {
      if (!opts.stretch) {
        opts.dragY.setValue(Math.max(0, g.dy));
        return;
      }
      if (g.dy < 0) opts.stretch.onUpward?.();
      const next = sheetHeaderStretchFromDy(startStretch, g.dy, opts.stretch.max());
      opts.stretch.set(next.stretch);
      opts.dragY.setValue(next.dismissDy);
    },
    onPanResponderRelease: (_e, g) => {
      if (opts.stretch) {
        const next = sheetHeaderStretchFromDy(startStretch, g.dy, opts.stretch.max());
        opts.stretch.set(next.stretch);
        if (
          sheetHeaderDismissAfterStretch({
            startStretch,
            stretch: next.stretch,
            dy: g.dy,
            vy: g.vy,
            dismissDy: SHEET_HEADER_DISMISS_DY,
            dismissVy: SHEET_HEADER_DISMISS_VY,
          })
        ) {
          opts.onDismiss();
          snapSheetDragY(opts.dragY, 180).start();
          return;
        }
        const snapped = sheetHeaderStretchSnap(next.stretch, opts.stretch.max(), g.vy);
        (opts.stretch.snap ?? opts.stretch.set)(snapped);
        snapSheetDragY(opts.dragY).start();
        return;
      }
      if (g.dy > SHEET_HEADER_DISMISS_DY || g.vy > SHEET_HEADER_DISMISS_VY) {
        opts.onDismiss();
        snapSheetDragY(opts.dragY, 180).start();
      } else {
        snapSheetDragY(opts.dragY).start();
      }
    },
    onPanResponderTerminate: () => {
      snapSheetDragY(opts.dragY).start();
    },
  });
}
