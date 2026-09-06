import React from "react";
import { createPortal } from "react-dom";
import { Animated, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/sim/colors";
import { backdropIn, backdropOut, sheetEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { geist } from "@/lib/sim/geistFonts";

const APPS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; bg: string }[] = [
  { id: "messages", label: "Messages", icon: "chatbubble", bg: "#34C759" },
  { id: "mail", label: "Mail", icon: "mail", bg: "#007AFF" },
  { id: "notes", label: "Notes", icon: "document-text", bg: "#FFD60A" },
  { id: "reminders", label: "Reminders", icon: "list", bg: "#FF453A" },
  { id: "photos", label: "Photos", icon: "images", bg: "#FFFFFF" },
];

const ACTIONS = ["Copy", "Add to Notes", "Print"] as const;

export function IosShareSheet({
  visible,
  message,
  onClose,
}: {
  visible: boolean;
  message: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [render, setRender] = React.useState(visible);
  const enter = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    if (visible) {
      setRender(true);
      sheetEnter(enter).start();
      backdropIn(dim).start();
    } else if (render) {
      backdropOut(dim).start();
      sheetExit(enter).start(({ finished }) => finished && setRender(false));
    }
  }, [visible]);

  if (!render) return null;

  const finish = async (action?: string) => {
    if (action === "Copy" && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        // Clipboard can fail in insecure contexts.
      }
    }
    onClose();
  };

  const overlay = (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 }}>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: dim }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: Math.max(insets.bottom, 8),
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }],
        }}
      >
        <View style={{ backgroundColor: "#1c1c1e", borderRadius: 14, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
            <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>AirDrop</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              {["Nearby", "iPhone"].map((label) => (
                <Pressable key={label} onPress={() => finish()} style={{ alignItems: "center", width: 64 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 1.5,
                      borderColor: "rgba(10,132,255,0.55)",
                      backgroundColor: "#2c2c2e",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="person" size={22} color="#8E8E93" />
                  </View>
                  <Text style={{ marginTop: 6, fontFamily: geist.regular, fontSize: 11, color: colors.textPrimary }} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 16, gap: 14 }}>
            {APPS.map((app) => (
              <Pressable key={app.id} onPress={() => finish()} style={{ alignItems: "center", width: 64 }}>
                <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: app.bg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons
                    name={app.icon}
                    size={26}
                    color={app.id === "notes" ? "#1c1c1e" : app.id === "photos" ? "#FF2D55" : "#fff"}
                  />
                </View>
                <Text style={{ marginTop: 6, fontFamily: geist.regular, fontSize: 11, color: colors.textPrimary }} numberOfLines={1}>
                  {app.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
          {ACTIONS.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => finish(label)}
              style={{
                paddingHorizontal: 16,
                height: 48,
                justifyContent: "center",
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ fontFamily: geist.regular, fontSize: 17, color: "#0A84FF" }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onClose}
          style={{
            marginTop: 8,
            height: 56,
            borderRadius: 14,
            backgroundColor: "#1c1c1e",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: geist.semibold, fontSize: 17, color: "#0A84FF" }}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}

export function shareMessage(market?: string, title?: string) {
  const pick = title || "this pick";
  const mkt = market || "Predict";
  return `I just bought ${pick} on ${mkt}.`;
}
