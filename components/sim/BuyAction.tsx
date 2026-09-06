import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing, PanResponder, Platform, View, type StyleProp, type ViewStyle } from "react-native";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
  FontWeight,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { useSwipeToBuy } from "@/lib/sim/swipeToBuyStore";
import { geist } from "@/lib/sim/geistFonts";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { AmbientBrandGradient, BRAND_ON_GRADIENT } from "@/components/sim/AmbientBrandGradient";
import { ComboGradientFill } from "@/components/sim/ComboGradient";

const TRACK_H = 52;
const PAD = 4;
const COMPLETE = 0.86;
const HOLD_MS = 480;
const ENGAGE_MS = 140;
const CONFIRM_COPY = "Let's go";

export function BuyAction({
  label,
  onConfirm,
  disabled = false,
  height = TRACK_H,
  style,
  combo = false,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  combo?: boolean;
}) {
  const swipe = useSwipeToBuy();
  const betR = useBetRadius();
  if (!swipe) {
    return (
      <View style={style}>
        <Button
          variant={ButtonVariant.Primary}
          size={height <= 44 ? ButtonSize.Md : ButtonSize.Lg}
          isFullWidth
          isDisabled={disabled}
          onPress={onConfirm}
          twClassName={betR === 999 ? "rounded-full" : undefined}
          style={{ borderRadius: betR }}
        >
          {label}
        </Button>
      </View>
    );
  }
  return <SwipeToBuy label={label} onConfirm={onConfirm} disabled={disabled} height={height} style={style} combo={combo} />;
}

function SwipeToBuy({
  label,
  onConfirm,
  disabled,
  height,
  style,
  combo,
}: {
  label: string;
  onConfirm: () => void;
  disabled: boolean;
  height: number;
  style?: StyleProp<ViewStyle>;
  combo: boolean;
}) {
  const thumb = height - PAD * 2;
  const trackRadius = height / 2;
  const thumbRadius = thumb / 2;
  const tx = useRef(new Animated.Value(0)).current;
  const engaged = useRef(new Animated.Value(0)).current;
  const [trackW, setTrackW] = useState(0);
  const maxX = Math.max(0, trackW - PAD * 2 - thumb);
  const done = useRef(false);
  const dragging = useRef(false);
  const originX = useRef(0);
  const maxRef = useRef(0);
  maxRef.current = maxX;
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    done.current = false;
    tx.stopAnimation();
    tx.setValue(0);
    engaged.stopAnimation();
    engaged.setValue(0);
  }, [label, tx, engaged]);

  const engage = () => {
    Animated.timing(engaged, { toValue: 1, duration: ENGAGE_MS, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };

  const reset = () => {
    done.current = false;
    Animated.timing(engaged, { toValue: 0, duration: ENGAGE_MS, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    Animated.spring(tx, { toValue: 0, useNativeDriver: false, bounciness: 6, speed: 18 }).start();
  };

  const applyX = (dx: number) => {
    if (disabled || done.current) return;
    tx.setValue(Math.max(0, Math.min(maxRef.current, dx)));
  };

  const releaseX = (dx: number) => {
    if (disabled || done.current) return;
    const x = Math.max(0, Math.min(maxRef.current, dx));
    if (maxRef.current > 0 && x / maxRef.current >= COMPLETE) {
      done.current = true;
      Animated.timing(tx, { toValue: maxRef.current, duration: 90, useNativeDriver: false }).start(({ finished }) => {
        if (!finished) return;
        setTimeout(() => onConfirmRef.current(), HOLD_MS);
      });
      return;
    }
    reset();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          if (done.current) return;
          tx.stopAnimation();
          engage();
        },
        onPanResponderMove: (_, g) => applyX(g.dx),
        onPanResponderRelease: (_, g) => releaseX(g.dx),
        onPanResponderTerminate: () => {
          if (!done.current) reset();
        },
      }),
    [disabled, tx],
  );

  const onPointerDown = (pageX: number) => {
    if (disabled || done.current) return;
    dragging.current = true;
    originX.current = pageX;
    tx.stopAnimation();
    engage();
    const move = (ev: PointerEvent) => {
      if (!dragging.current) return;
      applyX(ev.pageX - originX.current);
    };
    const up = (ev: PointerEvent) => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      releaseX(ev.pageX - originX.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const end = Math.max(1, maxX);
  const fillPad = engaged.interpolate({
    inputRange: [0, 1],
    outputRange: [0, thumb + 2],
  });
  const fillW = Animated.add(tx, fillPad);
  const innerW = Math.max(thumb, trackW - PAD * 2);
  const innerH = Math.max(1, thumb);
  const labelOpacity = tx.interpolate({
    inputRange: [0, end * 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const luckOpacity = tx.interpolate({
    inputRange: [0, end * 0.62, end * 0.88, end],
    outputRange: [0, 0, 1, 1],
    extrapolate: "clamp",
  });
  const thumbBgOpacity = engaged.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const arrowDarkOpacity = engaged.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  // Keep inputRange strictly increasing. `[0, 1, end*0.82, end]` is invalid
  // while the track is unmeasured (`end` is clamped to 1 → 0,1,0.82,1).
  const arrowWhiteOpacity = Animated.multiply(
    engaged,
    tx.interpolate({
      inputRange: [0, end * 0.82, end],
      outputRange: [1, 1, 0],
      extrapolate: "clamp",
    }),
  );

  return (
    <View
      style={[
        {
          height,
          borderRadius: trackRadius,
          backgroundColor: colors.surface2,
          overflow: "hidden",
          opacity: disabled ? 0.5 : 1,
          padding: PAD,
          ...(Platform.OS === "web"
            ? ({ touchAction: "none", userSelect: "none", cursor: "grab" } as ViewStyle)
            : null),
        },
        style,
      ]}
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe right to confirm"
      {...(Platform.OS === "web" ? {} : responder.panHandlers)}
      {...(Platform.OS === "web"
        ? {
            onPointerDown: (e: { nativeEvent: { pageX: number; button?: number } }) => {
              if (e.nativeEvent.button != null && e.nativeEvent.button !== 0) return;
              onPointerDown(e.nativeEvent.pageX);
            },
          }
        : null)}
    >
      <View style={{ flex: 1, overflow: "hidden", borderRadius: thumbRadius }} pointerEvents="none">
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: fillW,
            borderRadius: thumbRadius,
            overflow: "hidden",
          }}
        >
          {combo ? (
            <ComboGradientFill animate style={{ width: innerW, height: innerH }} />
          ) : (
            <AmbientBrandGradient style={{ width: innerW, height: innerH }} />
          )}
        </Animated.View>
        <Animated.View
          style={{
            ...absoluteFill,
            alignItems: "center",
            justifyContent: "center",
            opacity: labelOpacity,
          }}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            style={{ color: "#fff", fontFamily: geist.medium }}
          >
            {`Swipe to ${label.toLowerCase()}`}
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            ...absoluteFill,
            alignItems: "center",
            justifyContent: "center",
            opacity: luckOpacity,
          }}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            style={{ color: BRAND_ON_GRADIENT, fontFamily: geist.semibold }}
          >
            {CONFIRM_COPY}
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            width: thumb,
            height: thumb,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: tx }],
          }}
        >
          {combo ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={{
                  ...absoluteFill,
                  borderRadius: thumbRadius,
                  overflow: "hidden",
                  opacity: thumbBgOpacity,
                }}
              >
                <ComboGradientFill style={{ width: thumb, height: thumb }} />
              </Animated.View>
              <Ionicons name="arrow-forward" size={18} color={BRAND_ON_GRADIENT} />
            </>
          ) : (
            <>
              <Animated.View
                style={{
                  ...absoluteFill,
                  borderRadius: thumbRadius,
                  backgroundColor: "#ffffff",
                  opacity: thumbBgOpacity,
                }}
              />
              <Animated.View style={{ ...absoluteFill, alignItems: "center", justifyContent: "center", opacity: arrowDarkOpacity }}>
                <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconDefault} style={{ color: "#131416" }} />
              </Animated.View>
              <Animated.View style={{ ...absoluteFill, alignItems: "center", justifyContent: "center", opacity: arrowWhiteOpacity }}>
                <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconInverse} style={{ color: "#ffffff" }} />
              </Animated.View>
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const absoluteFill = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
