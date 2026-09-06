import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/sim/colors";
import { detentEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { geist } from "@/lib/sim/geistFonts";

// Compact detent help sheet explaining a market type ("What's a spread?").
// Opened from the (?) icon on market cards. Detent motion vocabulary:
// enter tween 0.32s [0.32,0.72,0,1], exit tween 0.28s, backdrop 0.2s fade.
export function MarketHelpSheet({
  visible,
  title,
  paragraphs,
  onClose,
}: {
  visible: boolean;
  title: string;
  paragraphs: string[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRender(true);
    } else {
      Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, fade, slide]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([detentEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || 320, 0] });

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            backgroundColor: "#18181B",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 40 + insets.bottom,
          }}
        >
          {/* Grabber */}
          <View style={{ alignItems: "center", marginBottom: 14 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" }} />
          </View>
          <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 23, color: colors.textPrimary }}>{title}</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
                {p}
              </Text>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginTop: 20,
              height: 48,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: "#131416" }}>Got it</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
