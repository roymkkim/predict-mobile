import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

// Mock iOS dark-mode keyboard for the onboarding flow. The sim runs where the
// system keyboard never shows (web preview / demo), so the flow docks this at
// the bottom of its modal and feeds key presses into the active fake input.
//
// Modes:
// - "qwerty": letters with shift + "123" symbol page ("ABC" to return)
// - "email":  qwerty whose bottom row adds "@" and "." (iOS email keyboard)
// - "number": iOS number pad (digits + backspace)

export type KeyboardMode = "qwerty" | "email" | "number";

/** QWERTY body: paddingTop 8 + 4×44 keys + 3×10 row gaps (excludes bottom inset padding). */
export const IOS_KEYBOARD_QWERTY_BODY = 8 + 44 * 4 + 10 * 3;

export function iosKeyboardHeight(bottomInset: number): number {
  return IOS_KEYBOARD_QWERTY_BODY + bottomInset + 40;
}

const KB_BG = "#2B2B2D";
const KEY_BG = "#6B6B6E";
const KEY_BG_DARK = "#48484B";
const ACCESSORY_ACCENT = "#8B99FF";
const ACCESSORY_BORDER = "#48484B";

const ROW1 = "qwertyuiop".split("");
const ROW2 = "asdfghjkl".split("");
const ROW3 = "zxcvbnm".split("");
const NUM1 = "1234567890".split("");
const NUM2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'];
const NUM3 = [".", ",", "?", "!", "'"];

function Key({
  label,
  icon,
  onPress,
  flex = 1,
  dark,
  active,
}: {
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  flex?: number;
  dark?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { flex, backgroundColor: active ? "#fff" : dark ? KEY_BG_DARK : KEY_BG },
        pressed && { opacity: 0.6 },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={active ? "#000" : "#fff"} />
      ) : (
        <Text style={[styles.keyText, active && { color: "#000" }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// iOS "next" action key. Default: gray key with a forward arrow (next field).
// "check" variant: iOS blue check — used on the last field to close the keyboard.
function CheckKey({ onPress, flex = 2, variant = "arrow" }: { onPress: () => void; flex?: number; variant?: "arrow" | "check" }) {
  const check = variant === "check";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.key, { flex, backgroundColor: check ? "#3478F6" : KEY_BG_DARK }, pressed && { opacity: 0.7 }]}
    >
      {check ? (
        <Ionicons name="checkmark" size={22} color="#fff" />
      ) : (
        <MaterialIcons name="arrow-forward" size={28} color="#fff" />
      )}
    </Pressable>
  );
}

export function IOSKeyboard({
  mode,
  onKey,
  onBackspace,
  showAccessory = false,
  onPrevious,
  onNext,
  onDone,
  nextVariant = "arrow",
  bottomInset = 0,
}: {
  mode: KeyboardMode;
  onKey: (ch: string) => void;
  onBackspace: () => void;
  // The native-style field navigation strip is shown above numpads only
  // when the flow opts into it (KYC in the onboarding prototype).
  showAccessory?: boolean;
  onPrevious?: () => void;
  // Action key handler ("next field" / close). When omitted the key is inert.
  onNext?: () => void;
  onDone?: () => void;
  // "check" renders the blue iOS check (close-keyboard affordance).
  nextVariant?: "arrow" | "check";
  bottomInset?: number;
}) {
  const [shift, setShift] = useState(true);
  const [symbols, setSymbols] = useState(false);

  const letter = (ch: string) => {
    onKey(shift ? ch.toUpperCase() : ch);
    if (shift) setShift(false);
  };

  if (mode === "number") {
    const rows = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
    ];
    return (
      <View>
        {showAccessory ? (
          <View style={styles.accessory}>
            <View style={styles.accessoryNav}>
              <Pressable
                accessibilityLabel="Previous field"
                disabled={!onPrevious}
                onPress={onPrevious}
                style={({ pressed }) => [styles.accessoryButton, !onPrevious && styles.accessoryButtonDisabled, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="chevron-up" size={25} color={onPrevious ? ACCESSORY_ACCENT : "#66676A"} />
              </Pressable>
              <Pressable
                accessibilityLabel="Next field"
                disabled={!onNext}
                onPress={onNext}
                style={({ pressed }) => [styles.accessoryButton, !onNext && styles.accessoryButtonDisabled, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="chevron-down" size={25} color={onNext ? ACCESSORY_ACCENT : "#66676A"} />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onDone ?? onNext} style={({ pressed }) => [styles.accessoryDone, pressed && { opacity: 0.55 }]}>
              <Text style={styles.accessoryDoneText}>Done</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.wrap, { paddingBottom: bottomInset + 40 }]}>
        {rows.map((r) => (
          <View key={r[0]} style={styles.row}>
            {r.map((k) => (
              <Key key={k} label={k} onPress={() => onKey(k)} />
            ))}
          </View>
        ))}
        <View style={styles.row}>
          {onNext && !showAccessory ? <CheckKey flex={1} variant={nextVariant} onPress={onNext} /> : <View style={{ flex: 1 }} />}
          <Key label="0" onPress={() => onKey("0")} />
          <Pressable onPress={onBackspace} style={({ pressed }) => [styles.key, { flex: 1, backgroundColor: "transparent" }, pressed && { opacity: 0.5 }]}>
            <Ionicons name="backspace-outline" size={22} color="#fff" />
          </Pressable>
        </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset + 40 }]}>
      {symbols ? (
        <>
          <View style={styles.row}>
            {NUM1.map((k) => (
              <Key key={k} label={k} onPress={() => onKey(k)} />
            ))}
          </View>
          <View style={[styles.row, { paddingHorizontal: 0 }]}>
            {NUM2.map((k) => (
              <Key key={k} label={k} onPress={() => onKey(k)} />
            ))}
          </View>
          <View style={styles.row}>
            <Key label="#+=" dark flex={1.4} onPress={() => {}} />
            <View style={{ flex: 0.4 }} />
            {NUM3.map((k) => (
              <Key key={k} label={k} onPress={() => onKey(k)} />
            ))}
            <View style={{ flex: 0.4 }} />
            <Key icon="backspace-outline" dark flex={1.4} onPress={onBackspace} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.row}>
            {ROW1.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => letter(k)} />
            ))}
          </View>
          <View style={[styles.row, { paddingHorizontal: 18 }]}>
            {ROW2.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => letter(k)} />
            ))}
          </View>
          <View style={styles.row}>
            <Key icon={shift ? "arrow-up-circle" : "arrow-up-circle-outline"} dark active={shift} flex={1.4} onPress={() => setShift((s) => !s)} />
            <View style={{ flex: 0.2 }} />
            {ROW3.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => letter(k)} />
            ))}
            <View style={{ flex: 0.2 }} />
            <Key icon="backspace-outline" dark flex={1.4} onPress={onBackspace} />
          </View>
        </>
      )}
      <View style={styles.row}>
        <Key label={symbols ? "ABC" : "123"} dark flex={1.6} onPress={() => setSymbols((s) => !s)} />
        {mode === "email" && !symbols ? (
          <>
            <Key label="space" flex={4} onPress={() => onKey(" ")} />
            <Key label="@" flex={1.2} onPress={() => onKey("@")} />
            <Key label="." flex={1.2} onPress={() => onKey(".")} />
          </>
        ) : (
          <Key label="space" flex={6} onPress={() => onKey(" ")} />
        )}
        {onNext ? <CheckKey variant={nextVariant} onPress={onNext} /> : <Key label="return" dark flex={2} onPress={() => {}} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessory: {
    height: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: KB_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ACCESSORY_BORDER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ACCESSORY_BORDER,
  },
  accessoryNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessoryButton: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  accessoryButtonDisabled: {
    opacity: 0.45,
  },
  accessoryDone: {
    minWidth: 48,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  accessoryDoneText: {
    fontFamily: Platform.OS === "web" ? "-apple-system, system-ui, 'Helvetica Neue', sans-serif" : "System",
    fontSize: 16,
    fontWeight: "600",
    color: ACCESSORY_ACCENT,
  },
  wrap: {
    backgroundColor: KB_BG,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 2,
  },
  key: {
    height: 44,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    // iOS keys have a subtle bottom shadow line.
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 0 rgba(0,0,0,0.35)" as unknown as undefined }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.35, shadowRadius: 0 }),
  },
  keyText: {
    fontSize: 21,
    color: "#fff",
    ...(Platform.OS === "web" ? { fontFamily: "-apple-system, system-ui, 'Helvetica Neue', sans-serif" } : null),
  },
});
