import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/sim/colors";
import { createSheetHeaderPan, sheetEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";

// Shared balance figure so the header pill, the portfolio card, and this sheet
// always read the same value.
export const BALANCE = "$123.12";

// Money bottom sheet opened by tapping the green balance pill in the nav header.
// "Available balance" with a large balance figure and Fund / Withdraw actions.
// Presentational only (the simulator has no real money flow).
export function MoneySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const betR = useBetRadius();
  const insets = useSafeAreaInsets();
  // Drive open/close manually so the sheet SLIDES up while the dark backdrop
  // FADES in (RN's animationType="slide" would slide both together).
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current; // 0 = hidden (down), 1 = shown
  const fade = useRef(new Animated.Value(0)).current; // backdrop opacity 0..1
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const headerPan = useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => onCloseRef.current(),
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setRender(true);
      dragY.setValue(0);
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
      Animated.parallel([sheetEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || 400, 0] }),
    dragY,
  );

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: insets.bottom + 40,
          }}
        >
          <View {...headerPan.panHandlers}>
            <View style={{ alignItems: "center", marginBottom: 14 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 18, color: "#fff" }}>Available balance</Text>
              <Pressable onPress={onClose} hitSlop={10} style={{ position: "absolute", right: 0, height: 28, width: 28, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>

          <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 48, lineHeight: 58, color: "#fff", textAlign: "center", marginBottom: 28 }}>
            {BALANCE}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            {([
              { label: "Fund", icon: "add" as const },
              { label: "Withdraw", icon: "arrow-downward" as const },
            ]).map(({ label, icon }) => (
              <Pressable
                key={label}
                onPress={onClose}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 56,
                  borderRadius: betR,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.surface2,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <MaterialIcons name={icon} size={20} color="#fff" />
                <Text style={{ fontFamily: geist.medium, fontSize: 16, color: "#fff" }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
