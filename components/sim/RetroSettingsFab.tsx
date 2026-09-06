import { PanResponder, Platform, Text, useWindowDimensions, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  requestOpenSettings,
  setSettingsFabPos,
  toggleSettingsFabVisible,
  useSettingsFabPos,
  useSettingsFabVisible,
} from "@/lib/sim/settingsFabStore";

const FAB_W = 56;
const FAB_H = 52;
const EDGE = 8;
const DRAG_SLOP = 8;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function defaultPos(width: number, height: number): { x: number; y: number } {
  return {
    x: Math.max(EDGE, width - FAB_W - EDGE),
    y: Math.round((height - FAB_H) / 2),
  };
}

function snapToEdge(
  x: number,
  y: number,
  width: number,
  height: number,
  insetTop: number,
  insetBottom: number,
): { x: number; y: number } {
  const minX = EDGE;
  const maxX = Math.max(EDGE, width - FAB_W - EDGE);
  const minY = insetTop + EDGE;
  const maxY = Math.max(minY, height - FAB_H - insetBottom - EDGE);
  const cx = x + FAB_W / 2;
  const cy = y + FAB_H / 2;
  const dLeft = cx;
  const dRight = width - cx;
  const dTop = cy;
  const dBottom = height - cy;
  const nearest = Math.min(dLeft, dRight, dTop, dBottom);
  let nx = clamp(x, minX, maxX);
  let ny = clamp(y, minY, maxY);
  if (nearest === dLeft || nearest === dRight) {
    nx = nearest === dLeft ? minX : maxX;
  } else {
    ny = nearest === dTop ? minY : maxY;
  }
  return { x: nx, y: ny };
}

// Floating "Settings" tile: classic Win95 / platinum control so it reads as a
// debug/meta affordance. Drag to reposition; tap to open settings.
export function RetroSettingsFab({ onPress }: { onPress?: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ m?: string }>();
  const stored = useSettingsFabPos();
  const visible = useSettingsFabVisible();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key !== "s" && event.key !== "S") return;
      event.preventDefault();
      toggleSettingsFabVisible();
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "predict:toggle-settings-fab") toggleSettingsFabVisible();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
    };
  }, []);
  const [pressed, setPressed] = useState(false);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const rested = stored ?? defaultPos(width, height);
  const pos = live ?? rested;
  const posRef = useRef(pos);
  posRef.current = pos;

  const handlePress =
    onPress ??
    (() => {
      const returnPath =
        pathname === "/match-detail" && typeof params.m === "string"
          ? `/match-detail?m=${encodeURIComponent(params.m)}`
          : pathname;
      requestOpenSettings(returnPath === "/" ? undefined : returnPath);
      if (pathname !== "/") router.navigate("/");
    });
  const pressRef = useRef(handlePress);
  pressRef.current = handlePress;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragged.current = false;
          origin.current = { ...posRef.current };
          setPressed(true);
        },
        onPanResponderMove: (_e, g) => {
          if (Math.hypot(g.dx, g.dy) > DRAG_SLOP) dragged.current = true;
          setLive({ x: origin.current.x + g.dx, y: origin.current.y + g.dy });
        },
        onPanResponderRelease: (_e, g) => {
          setPressed(false);
          const start = origin.current;
          if (!dragged.current) {
            setLive(null);
            pressRef.current();
            return;
          }
          const next = snapToEdge(start.x + g.dx, start.y + g.dy, width, height, insets.top, insets.bottom);
          setLive(null);
          setSettingsFabPos(next);
        },
        onPanResponderTerminate: () => {
          setPressed(false);
          setLive(null);
        },
      }),
    [height, insets.bottom, insets.top, width],
  );

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 80 }}>
      <View
        {...pan.panHandlers}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: FAB_W,
          ...(Platform.OS === "web"
            ? ({ cursor: pressed ? "grabbing" : "grab", touchAction: "none", userSelect: "none" } as Record<string, string>)
            : null),
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 3,
            top: 3,
            right: -3,
            bottom: -3,
            backgroundColor: "#000000",
            borderRadius: 3,
            opacity: 0.55,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            width: FAB_W,
            height: FAB_H,
            borderRadius: 3,
            borderWidth: 1,
            borderColor: "#000000",
            backgroundColor: pressed ? "#9A9A9A" : "#DDDDDD",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 6,
            paddingBottom: 4,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              right: 1,
              bottom: 1,
              borderRadius: 2,
              borderTopWidth: 1.5,
              borderLeftWidth: 1.5,
              borderBottomWidth: 1.5,
              borderRightWidth: 1.5,
              borderTopColor: pressed ? "#6E6E6E" : "#FFFFFF",
              borderLeftColor: pressed ? "#6E6E6E" : "#FFFFFF",
              borderBottomColor: pressed ? "#EFEFEF" : "#8A8A8A",
              borderRightColor: pressed ? "#EFEFEF" : "#8A8A8A",
            }}
          />
          <Ionicons name="settings-sharp" size={22} color="#1A1A1A" />
          <Text
            style={{
              marginTop: 2,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 0.2,
              color: "#1A1A1A",
              fontFamily: "Courier",
            }}
          >
            Settings
          </Text>
        </View>
      </View>
    </View>
  );
}
