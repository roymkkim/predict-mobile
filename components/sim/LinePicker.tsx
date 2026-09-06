import React, { useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { comboMirroredIndex } from "@/lib/sim/comboPickEdit";
import { colors, MUTED_OUTLINE } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

const SP_ITEM_W = 56;
const SP_DIV_W = 30;
const SP_FADE_W = 80;
const TRAVEL_MIN_MS = 220;
const TRAVEL_MAX_MS = 340;
const CARET_H = 7;
const CARET_HALF = 6;
/** Inset from full-bleed strip edges so the line matches 16px sheet inset. */
const SLIP_HAIRLINE_INSET = 16;
const SLIP_HAIRLINE_PAD_BELOW = 12;

function lineItemCenter(i: number, dividerAt?: number): number {
  const before = dividerAt !== undefined && i >= dividerAt ? SP_DIV_W : 0;
  return i * SP_ITEM_W + before + SP_ITEM_W / 2;
}

function fadeEdge(color: string): string {
  if (color === "#000000" || color === "#000") return "rgba(0,0,0,0)";
  if (color === "#18181B") return "rgba(24,24,27,0)";
  if (color === "#141414") return "rgba(20,20,20,0)";
  return "transparent";
}

function travelMs(from: number, to: number): number {
  const dist = Math.abs(to - from);
  return Math.round(Math.min(TRAVEL_MAX_MS, Math.max(TRAVEL_MIN_MS, 180 + dist * 0.45)));
}

/** Shared NYY/LAD spread strip: numbers, optional `<>` divider, optional up-triangle under the active tick. */
export function LinePicker({
  labels,
  dividerAt,
  index,
  onIndex,
  fadeColor = "#18181B",
  edge = 16,
  dividerColors,
  showCaret = true,
  /** Combo slip: 16px-inset hairline under the caret. Off when a longer full-bleed divider follows. */
  underCaretHairline = false,
}: {
  labels: string[];
  dividerAt?: number;
  index: number;
  onIndex: (i: number) => void;
  fadeColor?: string;
  edge?: number;
  dividerColors?: [string, string];
  showCaret?: boolean;
  underCaretHairline?: boolean;
}) {
  const [w, setW] = useState(0);
  const [visual, setVisual] = useState(index);
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const dragStart = useRef(0);
  const snapRef = useRef<(() => void) | undefined>(undefined);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmatic = useRef(false);
  const dragging = useRef(false);
  const fromUser = useRef(false);
  const laidOut = useRef(false);
  const committed = useRef(index);
  const anim = useRef(new Animated.Value(0)).current;
  const animRun = useRef<Animated.CompositeAnimation | null>(null);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => Platform.OS === "web" && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponder: (_e, g) => Platform.OS === "web" && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStart.current = offsetRef.current;
      },
      onPanResponderMove: (_e, g) => {
        scrollRef.current?.scrollTo({ x: dragStart.current - g.dx, animated: false });
      },
      onPanResponderRelease: () => {
        dragging.current = false;
        snapRef.current?.();
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        snapRef.current?.();
      },
    }),
  ).current;
  React.useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      animRun.current?.stop();
    },
    [anim],
  );
  const pad = Math.max(0, w / 2 - SP_ITEM_W / 2);
  const offsets = labels.map((_, i) => lineItemCenter(i, dividerAt) - SP_ITEM_W / 2);
  const nearest = (x: number) => {
    let best = 0;
    let bd = Infinity;
    offsets.forEach((o, i) => {
      const d = Math.abs(o - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const paintOffset = (x: number) => {
    offsetRef.current = x;
    scrollRef.current?.scrollTo({ x, animated: false });
    const i = nearest(x);
    setVisual((v) => (v === i ? v : i));
  };
  React.useEffect(() => {
    const id = anim.addListener(({ value }) => paintOffset(value));
    return () => anim.removeListener(id);
    // offsets/nearest change with width; listener always reads latest via closure on each attach
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, w, labels.length, dividerAt]);
  const jumpTo = (i: number) => {
    animRun.current?.stop();
    const x = offsets[i] ?? 0;
    programmatic.current = true;
    anim.setValue(x);
    paintOffset(x);
    programmatic.current = false;
  };
  const animateTo = (i: number) => {
    const to = offsets[i] ?? offsetRef.current;
    const from = offsetRef.current;
    if (Math.abs(to - from) < 0.5) {
      paintOffset(to);
      return;
    }
    animRun.current?.stop();
    programmatic.current = true;
    anim.setValue(from);
    const run = Animated.timing(anim, {
      toValue: to,
      duration: travelMs(from, to),
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animRun.current = run;
    run.start(({ finished }) => {
      if (!finished) return;
      paintOffset(to);
      programmatic.current = false;
    });
  };
  React.useEffect(() => {
    if (w <= 0) return;
    if (!laidOut.current) {
      laidOut.current = true;
      jumpTo(index);
      committed.current = index;
      return;
    }
    if (fromUser.current) {
      fromUser.current = false;
      committed.current = index;
      return;
    }
    if (index === committed.current && nearest(offsetRef.current) === index) return;
    committed.current = index;
    animateTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, index]);
  const snapToNearest = () => {
    const i = nearest(offsetRef.current);
    if (i !== index) {
      fromUser.current = true;
      onIndex(i);
    }
    animateTo(i);
  };
  snapRef.current = snapToNearest;
  const edgeFade = fadeEdge(fadeColor);
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
      style={{
        marginHorizontal: -edge,
        overflow: "hidden",
        ...(Platform.OS === "web" ? { overscrollBehavior: "contain", overflowAnchor: "none" } : null),
      }}
    >
      <View>
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          snapToOffsets={offsets}
          decelerationRate="fast"
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onScroll={(e) => {
            offsetRef.current = e.nativeEvent.contentOffset.x;
            const i = nearest(e.nativeEvent.contentOffset.x);
            setVisual((v) => (v === i ? v : i));
            if (programmatic.current) return;
            if (dragging.current && i !== index) {
              fromUser.current = true;
              onIndex(i);
            }
            if (idleTimer.current) clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => {
              if (programmatic.current || dragging.current) return;
              const j = nearest(offsetRef.current);
              if (Math.abs(offsets[j] - offsetRef.current) > 0.5) snapToNearest();
            }, 140);
          }}
          onScrollEndDrag={() => {
            dragging.current = false;
            snapToNearest();
          }}
          onMomentumScrollEnd={() => {
            dragging.current = false;
            snapToNearest();
          }}
          contentContainerStyle={{ paddingHorizontal: pad, alignItems: "center" }}
        >
          {labels.map((label, i) => (
            <React.Fragment key={`${label}-${i}`}>
              {dividerAt !== undefined && i === dividerAt && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch team"
                  onPress={() => {
                    const j = comboMirroredIndex(index, dividerAt, labels);
                    fromUser.current = false;
                    onIndex(j);
                  }}
                  style={{ width: SP_DIV_W, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                >
                  <Feather name="chevron-left" size={13} color={dividerColors?.[0] ?? colors.textMuted} style={{ marginRight: -4 }} />
                  <Feather name="chevron-right" size={13} color={dividerColors?.[1] ?? colors.textMuted} />
                </Pressable>
              )}
              <Pressable
                hitSlop={6}
                onPress={() => {
                  fromUser.current = false;
                  onIndex(i);
                }}
                style={{ width: SP_ITEM_W, height: 34, alignItems: "center", justifyContent: "center" }}
              >
                <Text
                  style={{
                    fontFamily: i === visual ? geist.bold : geist.regular,
                    fontSize: 14,
                    color: i === visual ? colors.textPrimary : colors.textMuted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </ScrollView>
        <LinearGradient
          colors={[fadeColor, edgeFade]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: SP_FADE_W }}
        />
        <LinearGradient
          colors={[edgeFade, fadeColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: SP_FADE_W }}
        />
      </View>
      {showCaret || underCaretHairline ? (
        <View>
          {showCaret ? (
            <View
              style={{
                alignItems: "center",
                marginTop: 8,
                // Flush: ▲ base at the top of the hairline (touching, not overlapping).
                // Prior `-(CARET_H - hairline)` pulled the line into the triangle.
                marginBottom: 0,
                zIndex: 1,
              }}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: CARET_HALF,
                  borderRightWidth: CARET_HALF,
                  borderBottomWidth: CARET_H,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: colors.textPrimary,
                }}
              />
            </View>
          ) : null}
          {underCaretHairline ? (
            <>
              <View
                pointerEvents="none"
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: MUTED_OUTLINE,
                  marginHorizontal: SLIP_HAIRLINE_INSET,
                }}
              />
              <View style={{ height: SLIP_HAIRLINE_PAD_BELOW }} />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
