import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IOSKeyboard, type KeyboardMode } from "@/components/sim/IOSKeyboard";
import { closeOnboarding, completeOnboarding, useOnboarding } from "@/lib/sim/onboardingStore";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL } from "@/lib/sim/buttonStyle";
import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";

// Full-screen identity-verification onboarding, modeled 1:1 on the attached
// Kalshi reference mocks. Mounted once at the app root (like BetSlipSheet);
// raised via requestOnboarding() / the Settings toggle.
//
// Steps: splash -> email -> four-digit email code -> phone -> four-digit
// phone code -> info 1/2 (name / DOB / SSN) -> info 2/2 (address) ->
// confirm -> congrats.
//
// Text entry uses FAKE inputs + the mock IOSKeyboard docked at the bottom
// (the sim's demo surfaces never show a system keyboard), so every field is
// actually typeable. One field is "active" at a time; keys append to it.
// On web, the active fake input also listens to the physical desktop keyboard.

const BG = "#131416";
const INPUT_BORDER = "rgba(255,255,255,0.16)";
const DARK_FOCUS_BORDER = "#8E99F8";
const LIGHT_FOCUS_BORDER = "#4858F6";
const MUTED = "#9B9B9B";

function useFocusBorder(): string {
  return useThemeMode() === "light" ? LIGHT_FOCUS_BORDER : DARK_FOCUS_BORDER;
}

type Step = "intro" | "email" | "ecode" | "phone" | "pcode" | "info" | "confirm" | "done";

const ORDER: Step[] = ["intro", "email", "ecode", "phone", "pcode", "info", "confirm", "done"];

// Stepper (progress bar under the header bar). Four distinct steps:
// email + verification, phone + verification, add information, confirm.
const STEP_PROGRESS: Partial<Record<Step, number>> = {
  email: 1, ecode: 1, phone: 2, pcode: 2, info: 3, confirm: 4,
};
const STEP_TOTAL = 4;

function StepperBar({ step }: { step: Step }) {
  const frac = (STEP_PROGRESS[step] ?? 0) / STEP_TOTAL;
  const w = useRef(new Animated.Value(frac)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: frac, duration: 320, useNativeDriver: false }).start();
  }, [frac, w]);
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16, height: 8, borderRadius: 999, backgroundColor: "#2a2b2e", overflow: "hidden" }}>
      <Animated.View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.green,
          width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}

type FieldKey = "email" | "ecode" | "phone" | "pcode" | "first" | "last" | "dob" | "ssn" | "addr1" | "city" | "zip";

// Blinking caret shared by the fake inputs.
function Caret() {
  const focusBorder = useFocusBorder();
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0, duration: 480, delay: 320, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={{ width: 2, height: 20, backgroundColor: focusBorder, opacity: op }} />;
}

// Pressable fake input: shows value (or placeholder) + caret when active.
function FakeInput({
  value,
  placeholder,
  active,
  onPress,
  flex,
}: {
  value: string;
  placeholder: string;
  active: boolean;
  onPress: () => void;
  flex?: boolean;
}) {
  const focusBorder = useFocusBorder();
  return (
    <Pressable onPress={onPress} style={[styles.input, flex && { flex: 1 }, active && { borderColor: focusBorder }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {value ? (
          <Text style={styles.inputText} numberOfLines={1}>{value}</Text>
        ) : (
          <Text style={[styles.inputText, { color: MUTED }]} numberOfLines={1}>{placeholder}</Text>
        )}
        {active ? <Caret /> : null}
      </View>
    </Pressable>
  );
}

// Field label above an input (per the "Add your information" mocks).
function Labeled({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[{ gap: 8 }, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ContinueBtn({ label = "Continue", enabled, onPress }: { label?: string; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        { backgroundColor: enabled ? "#fff" : "#9ca1af" },
        buttonInteractionStyle(pressed, !enabled),
      ]}
    >
      <Text style={[METAMASK_BUTTON_LABEL, { color: "#131416" }]}>{label}</Text>
    </Pressable>
  );
}

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

// Four-box verification code display (typed via the mock number pad).
function CodeBoxes({ value }: { value: string }) {
  const focusBorder = useFocusBorder();
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={[styles.codeBox, i === Math.min(value.length, 3) && value.length < 4 && { borderColor: focusBorder }]}
        >
          <Text style={{ fontFamily: geist.medium, fontSize: 18, color: "#fff" }}>{value[i] ?? ""}</Text>
        </View>
      ))}
    </View>
  );
}

// Footer under the code boxes: just the resend line.
function CodeFooter({ onResend }: { onResend: () => void }) {
  return (
    <Text style={{ fontFamily: geist.regular, fontSize: 14, color: MUTED }}>
      Didn't receive code?{" "}
      <Text style={{ textDecorationLine: "underline" }} onPress={onResend}>
        Resend it
      </Text>
    </Text>
  );
}

// Text-format summary row on the confirm screen (muted label over white
// value). Tappable — jumps back to the info form for edits.
function SummaryLine({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ gap: 4, opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ fontFamily: geist.regular, fontSize: 14, color: MUTED }}>{label}</Text>
      <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 24, color: "#fff" }}>{value}</Text>
    </Pressable>
  );
}

const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

// Detent-style bottom sheet listing all states (MetaMask visual language:
// dark surface, 12px-radius rows, Geist type). Motion per the iOS sheet spec:
// enter tween 0.32s ease [0.32,0.72,0,1]; exit tween 0.28s same ease;
// backdrop fades 0.2s. One driver animates the sheet (translateY only).
const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1);

function StateSheet({
  open,
  onSelect,
  onClose,
  bottomInset,
}: {
  open: boolean;
  onSelect: (abbr: string) => void;
  onClose: () => void;
  bottomInset: number;
}) {
  const winH = Dimensions.get("window").height;
  const sheetH = Math.round(winH * 0.62);
  const [mounted, setMounted] = useState(open);
  const ty = useRef(new Animated.Value(sheetH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 320, easing: SHEET_EASE, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(ty, { toValue: sheetH, duration: 280, easing: SHEET_EASE, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", opacity: backdrop }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetH,
          backgroundColor: "#1c1d21",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY: ty }],
        }}
      >
        {/* Grab handle */}
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.24)" }} />
        </View>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff", textAlign: "center", paddingVertical: 14 }}>
          State
        </Text>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 24 }}>
          {US_STATES.map((st) => {
            return (
              <Pressable
                key={st.abbr}
                onPress={() => onSelect(st.abbr)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 52,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "transparent",
                })}
              >
                <Text style={{ fontFamily: geist.regular, fontSize: 15, color: "#fff" }}>{st.name}</Text>
                <Text style={{ fontFamily: geist.regular, fontSize: 14, color: MUTED }}>{st.abbr}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const EMPTY_FIELDS: Record<FieldKey, string> = {
  email: "", ecode: "", phone: "", pcode: "", first: "", last: "", dob: "", ssn: "", addr1: "", city: "", zip: "",
};

// The flow presents in both Classic and UXR modes (the store's bet-tap gating
// stays Classic-only; in UXR the flow is raised by the Settings toggle).
export function OnboardingFlow() {
  return <OnboardingFlowInner />;
}

function OnboardingFlowInner() {
  const { visible } = useOnboarding();
  const insets = useSafeAreaInsets();
  const focusBorder = useFocusBorder();

  const [step, setStep] = useState<Step>("intro");
  const scrollRef = useRef<ScrollView>(null);
  // Which splash path was chosen. "existing" short-circuits after the email
  // code directly to the success state.
  const [path, setPath] = useState<"new" | "existing">("new");
  const [fields, setFields] = useState<Record<FieldKey, string>>(EMPTY_FIELDS);
  const [active, setActive] = useState<FieldKey | null>(null);
  const [stateFocused, setStateFocused] = useState(false);
  const [stateVal, setStateVal] = useState("CA");
  const [stateSheetOpen, setStateSheetOpen] = useState(false);
  // When set, the next Continue returns here instead of advancing (used when
  // editing the address from the confirm screen).
  const [returnStep, setReturnStep] = useState<Step | null>(null);
  // Keep an explicit completed-form snapshot so tapping Edit can never lose
  // the values that were shown on Confirm, even if the form remounts while
  // returning from the summary.
  const infoDraftRef = useRef<{ fields: Record<FieldKey, string>; stateVal: string } | null>(null);

  const set = (k: FieldKey, v: string) => setFields((f) => ({ ...f, [k]: v }));

  // Fresh flow every presentation.
  useEffect(() => {
    if (visible) {
      setStep("intro");
      setPath("new");
      setFields(EMPTY_FIELDS);
      setStateVal("CA");
      setStateSheetOpen(false);
      setActive(null);
      setStateFocused(false);
      setReturnStep(null);
      infoDraftRef.current = null;
    }
  }, [visible]);

  // Auto-focus the step's primary field.
  const focusFor = (s: Step): FieldKey | null => {
    switch (s) {
      case "email": return "email";
      case "ecode": return "ecode";
      case "phone": return "phone";
      case "pcode": return "pcode";
      case "info": return "first";
      default: return null;
    }
  };
  useEffect(() => {
    setActive(focusFor(step));
  }, [step]);

  const idx = ORDER.indexOf(step);
  const next = () => {
    if (step === "info") {
      infoDraftRef.current = { fields: { ...fields }, stateVal };
    }
    if (returnStep) {
      setStep(returnStep);
      setReturnStep(null);
      return;
    }
    // Existing-account path: after the email code, go directly to success.
    if (path === "existing" && step === "ecode") {
      setStep("done");
      return;
    }
    setStep(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  };
  // Congratulatory finish: complete the flow and land on the Predict home feed.
  const finish = () => {
    completeOnboarding();
    router.navigate("/");
  };
  // Show success briefly, then dismiss onboarding automatically.
  useEffect(() => {
    if (step !== "done") return;
    const t = setTimeout(finish, 1500);
    return () => clearTimeout(t);
  }, [step]);
  // Confirm-page edit: jump to the form step; its Continue returns to confirm.
  const editFrom = (s2: Step) => {
    if (s2 === "info" && infoDraftRef.current) {
      setFields({ ...infoDraftRef.current.fields });
      setStateVal(infoDraftRef.current.stateVal);
    }
    setReturnStep("confirm");
    setStep(s2);
  };
  const back = () => {
    if (returnStep) {
      setStep(returnStep);
      setReturnStep(null);
      return;
    }
    if (idx <= 0) closeOnboarding();
    else setStep(ORDER[idx - 1]);
  };

  // Per-field constraints applied to mock-keyboard input.
  const maxLen: Partial<Record<FieldKey, number>> = { ecode: 4, pcode: 4, zip: 5 };
  const numeric: FieldKey[] = ["ecode", "pcode", "phone", "zip", "ssn", "dob"];
  // 123 - 56 - 7890 (per mock).
  const fmtSsn = (t: string) => {
    const d = t.replace(/[^0-9]/g, "").slice(0, 9);
    if (d.length > 5) return `${d.slice(0, 3)} - ${d.slice(3, 5)} - ${d.slice(5)}`;
    if (d.length > 3) return `${d.slice(0, 3)} - ${d.slice(3)}`;
    return d;
  };
  // MM/DD/YY with auto-slashes (per mock).
  const fmtDob = (t: string) => {
    const d = t.replace(/[^0-9]/g, "").slice(0, 6);
    if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  };
  // NNN-NNN-NNNN.
  const fmtPhone = (t: string) => {
    const d = t.replace(/[^0-9]/g, "").slice(0, 10);
    if (d.length > 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d;
  };

  const onKey = (ch: string) => {
    if (!active) return;
    if (numeric.includes(active) && !/^[0-9]$/.test(ch)) return;
    const cur = fields[active];
    if (active === "ssn") return set("ssn", fmtSsn(cur + ch));
    if (active === "dob") return set("dob", fmtDob(cur + ch));
    if (active === "phone") return set("phone", fmtPhone(cur + ch));
    const cap = maxLen[active];
    if (cap && cur.length >= cap) return;
    const nextValue = cur + ch;
    set(active, nextValue);
    // Verification codes are complete as soon as their fourth digit is
    // entered. Advance through the same Continue path used by the CTA so
    // existing-account handling and the normal step transition stay intact.
    if ((active === "ecode" || active === "pcode") && nextValue.length === 4) {
      next();
    }
  };
  const onBackspace = () => {
    if (!active) return;
    const cur = fields[active];
    if (active === "ssn") return set("ssn", fmtSsn(cur.replace(/[^0-9]/g, "").slice(0, -1)));
    if (active === "dob") return set("dob", fmtDob(cur.replace(/[^0-9]/g, "").slice(0, -1)));
    if (active === "phone") return set("phone", fmtPhone(cur.replace(/[^0-9]/g, "").slice(0, -1)));
    set(active, cur.slice(0, -1));
  };

  // iOS "next" (blue check key): advance to the next form field on the merged
  // info screen; on single-field steps it advances the step when valid.
  const INFO_FIELD_ORDER: FieldKey[] = ["first", "last", "dob", "ssn", "addr1", "city", "zip"];
  const onKbNext = () => {
    if (step === "info" && active) {
      // Last field (zip): the blue check closes the keyboard; the Done CTA
      // then anchors to the bottom of the page.
      if (active === "zip") {
        setActive(null);
        return;
      }
      // State is a picker rather than a text field. Let the keyboard's next
      // action move focus to its control without opening the picker.
      if (active === "city") {
        setActive(null);
        setStateFocused(true);
        return;
      }
      const i = INFO_FIELD_ORDER.indexOf(active);
      if (i >= 0 && i < INFO_FIELD_ORDER.length - 1) {
        const nextField = INFO_FIELD_ORDER[i + 1];
        setActive(nextField);
        // Advancing past City: scroll the form to the end so the state/zip
        // row and the Done CTA are in view (header + stepper stay fixed).
        if (nextField === "zip") {
          requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        }
        return;
      }
      next();
      return;
    }
    // Single-field steps: check = Continue when the field has content.
    const ok =
      (step === "email" && fields.email.trim().length > 0) ||
      (step === "ecode" && fields.ecode.length > 0) ||
      (step === "phone" && fields.phone.replace(/[^0-9]/g, "").length > 0) ||
      (step === "pcode" && fields.pcode.length > 0);
    if (ok) next();
  };

  // Native-style accessory navigation for KYC number pads.
  const onKbPrevious = () => {
    if (step !== "info" || !active) return;
    if (active === "zip") {
      setActive(null);
      setStateFocused(true);
      return;
    }
    if (active === "city") {
      setActive("addr1");
      return;
    }
    const i = INFO_FIELD_ORDER.indexOf(active);
    if (i > 0) setActive(INFO_FIELD_ORDER[i - 1]);
  };

  const onKbDone = () => {
    setActive(null);
    setStateFocused(false);
  };

  // The preview intentionally uses fake inputs so the simulated keyboard can
  // be shown consistently on web and native. Mirror the important physical
  // keyboard keys into the same handlers used by the on-screen keyboard.
  useEffect(() => {
    if (Platform.OS !== "web" || !visible || !active) return;
    const onDesktopKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        onBackspace();
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        onKbNext();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onKbDone();
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        onKey(event.key);
      }
    };
    window.addEventListener("keydown", onDesktopKeyDown);
    return () => window.removeEventListener("keydown", onDesktopKeyDown);
  }, [active, onBackspace, onKbDone, onKbNext, onKey, visible]);

  const kbMode: KeyboardMode | null = active
    ? active === "email"
      ? "email"
      : numeric.includes(active)
        ? "number"
        : "qwerty"
    : null;

  const ssnLast4 = fields.ssn.replace(/[^0-9]/g, "").slice(5);
  const infoHasValues =
    fields.first.trim().length > 0 ||
    fields.last.trim().length > 0 ||
    fields.dob.length > 0 ||
    fields.ssn.length > 0 ||
    fields.addr1.trim().length > 0 ||
    fields.city.trim().length > 0 ||
    fields.zip.trim().length > 0;
  const focusField = (k: FieldKey) => {
    setStateFocused(false);
    setActive(k);
    // ZIP is the bottom row of the KYC form. Wait for the numeric keyboard
    // to mount, then reveal the same end-of-form state used after choosing a
    // state from the picker.
    if (step === "info" && k === "zip") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      });
    }
  };
  const fi = (k: FieldKey, placeholder: string, flex?: boolean) => (
    <FakeInput
      value={fields[k]}
      placeholder={placeholder}
      active={active === k}
      onPress={() => focusField(k)}
      flex={flex}
    />
  );

  const keyboardCta =
    kbMode && active
      ? step === "email"
        ? { label: "Continue", enabled: fields.email.trim().length > 0 }
        : step === "ecode"
          ? { label: "Continue", enabled: fields.ecode.length > 0 }
          : step === "phone"
            ? { label: "Continue", enabled: fields.phone.replace(/[^0-9]/g, "").length > 0 }
            : step === "pcode"
              ? { label: "Continue", enabled: fields.pcode.length > 0 }
              : step === "info"
                ? { label: "Done", enabled: returnStep === "confirm" || infoHasValues }
                : null
      : null;

  // Fully remove the native modal after dismissal. Keeping a hidden
  // React Native Modal mounted can leave iOS/Expo Go with an empty modal
  // surface over the underlying feed instead of revealing the route below.
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeOnboarding} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: screenTopInset(insets.top) + 8 }}>
        {step === "intro" && (
          <LinearGradient
            colors={["#190066", "#3F6FD0"]}
            locations={[0, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        {/* Top bar: back chevron (hidden on intro) + close */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44 }}>
          {step !== "intro" && step !== "done" ? (
            <Pressable onPress={back} hitSlop={8} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
              <MaterialIcons name="arrow-back-ios-new" size={22} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <View style={{ flex: 1 }} />
          {step === "confirm" ? (
            <Pressable onPress={() => editFrom("info")} hitSlop={8} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ fontFamily: geist.medium, fontSize: 16, color: focusBorder }}>Edit</Text>
            </Pressable>
          ) : step === "done" ? null : (
            <Pressable onPress={closeOnboarding} hitSlop={8} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {step !== "intro" && step !== "done" && path === "new" && <StepperBar step={step} />}

        {step === "intro" ? (
          <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
            <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 72 }}>
              <Text style={{ fontFamily: geist.semibold, fontSize: 24, lineHeight: 32, color: "#fff", textAlign: "center" }}>
                Predict the future
              </Text>
              <Text
                style={{
                  fontFamily: geist.regular,
                  fontSize: 16,
                  lineHeight: 24,
                  color: MUTED,
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                MetaMask now supports trading in the US with Kalshi. You'll need to verify your data to begin.
              </Text>
              {/* Crystal-ball hero (per splash mock), centered between copy and buttons. */}
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Image
                  source={require("@/assets/images/onboarding-crystal-ball.png")}
                  style={{ width: 361, height: 361 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={{ gap: 12 }}>
              <Pressable onPress={() => { setPath("new"); setStep("email"); }} style={({ pressed }) => [styles.cta, { backgroundColor: "#fff" }, buttonInteractionStyle(pressed)]}>
                <Text style={[METAMASK_BUTTON_LABEL, { color: "#131416" }]}>Create Kalshi account</Text>
              </Pressable>
              <Pressable onPress={() => { setPath("existing"); setStep("email"); }} style={({ pressed }) => [styles.cta, { backgroundColor: "rgba(255,255,255,0.24)" }, buttonInteractionStyle(pressed)]}>
                <Text style={[METAMASK_BUTTON_LABEL, { color: "#fff" }]}>Use existing Kalshi account</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              {step === "email" && (
                <View style={{ gap: 20 }}>
                  <StepHeader
                    title="Enter email"
                    sub="We'll email you a four-digit verification code to securely login or create an account with Kalshi."
                  />
                  {fi("email", "Email")}
                </View>
              )}

              {step === "ecode" && (
                <View style={{ gap: 16 }}>
                  <StepHeader
                    title="Enter verification code"
                    sub={`Enter the code we sent to ${fields.email || "your email"}. If you don't see it, check your spam folder.`}
                  />
                  <Pressable onPress={() => setActive("ecode")}>
                    <CodeBoxes value={fields.ecode} />
                  </Pressable>
                  <CodeFooter onResend={() => set("ecode", "")} />
                </View>
              )}

              {step === "phone" && (
                <View style={{ gap: 20 }}>
                  <StepHeader
                    title="Enter phone number"
                    sub="We'll send you a four-digit verification code to securely login or create an account with Kalshi. Data rates may apply."
                  />
                  {fi("phone", "Phone number")}
                </View>
              )}

              {step === "pcode" && (
                <View style={{ gap: 16 }}>
                  <StepHeader
                    title="Enter verification code"
                    sub={`Enter the code we sent to ${fields.phone || "your phone"}.`}
                  />
                  <Pressable onPress={() => setActive("pcode")}>
                    <CodeBoxes value={fields.pcode} />
                  </Pressable>
                  <CodeFooter onResend={() => set("pcode", "")} />
                </View>
              )}

              {step === "info" && (
                <View style={{ gap: 16, flexGrow: 1 }}>
                  <StepHeader title="Add your information" />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Labeled label="First name" flex>{fi("first", "John")}</Labeled>
                    <Labeled label="Last name" flex>{fi("last", "Smith")}</Labeled>
                  </View>
                  <Labeled label="Date of birth">{fi("dob", "MM/DD/YY")}</Labeled>
                  <Labeled label="Social security number">{fi("ssn", "**** - ** - 1234")}</Labeled>
                  <Labeled label="Street address">{fi("addr1", "Address")}</Labeled>
                  <Labeled label="City">{fi("city", "San Francisco")}</Labeled>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Labeled label="State" flex>
                      <Pressable
                        onPress={() => { setActive(null); setStateFocused(false); setStateSheetOpen(true); }}
                        style={({ pressed }) => [
                          styles.input,
                          { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                          stateFocused && { borderColor: focusBorder },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text style={{ fontFamily: geist.regular, fontSize: 15, color: "#fff" }}>{stateVal}</Text>
                        <Ionicons name="chevron-down" size={16} color={MUTED} />
                      </Pressable>
                    </Labeled>
                    <Labeled label="Zip code" flex>{fi("zip", "39202")}</Labeled>
                  </View>
                  <View style={{ height: 8 }} />
                  {active === null && (
                    <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: Math.max(0, 40 - 24) }}>
                      <ContinueBtn label="Done" enabled onPress={next} />
                    </View>
                  )}
                </View>
              )}

              {step === "confirm" && (
                <View style={{ gap: 20, flexGrow: 1 }}>
                  <StepHeader title="Confirm your information" />
                  <SummaryLine label="Name" value={`${fields.first || "First"} ${fields.last || "Last"}`.trim()} onPress={() => editFrom("info")} />
                  <SummaryLine label="Date of birth" value={fields.dob || "MM/DD/YYYY"} onPress={() => editFrom("info")} />
                  <SummaryLine label="Social" value={`* * * * - * * - ${ssnLast4 || "1234"}`} onPress={() => editFrom("info")} />
                  <SummaryLine
                    label="Address"
                    value={`${fields.addr1 || "Address"}\n${fields.city || "City"}, ${stateVal} ${fields.zip || "ZIP"}`}
                    onPress={() => editFrom("info")}
                  />
                  <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: Math.max(0, 40 - 24) }}>
                    <ContinueBtn label="Submit" enabled onPress={next} />
                  </View>
                </View>
              )}

              {step === "done" && (
                <View style={{ flexGrow: 1, alignItems: "center" }}>
                  <View style={{ flex: 1, alignItems: "center", gap: 24, paddingTop: Math.max(0, 94 - (insets.top + 52)) }}>
                    <Image
                      source={require("@/assets/images/onboarding-check.png")}
                      style={{ width: 361, height: 361 }}
                      resizeMode="contain"
                    />
                    <Text style={{ fontFamily: geist.semibold, fontSize: 24, lineHeight: 32, color: "#fff", textAlign: "center" }}>
                      You're all set
                    </Text>
                  </View>
                  <View style={{ alignSelf: "stretch", paddingBottom: 24 }}>
                    <ContinueBtn label="Let's go" enabled onPress={finish} />
                  </View>
                </View>
              )}
            </ScrollView>

            {kbMode ? (
              <>
                {keyboardCta && (
                  <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
                    <ContinueBtn label={keyboardCta.label} enabled={keyboardCta.enabled} onPress={next} />
                  </View>
                )}
                <IOSKeyboard
                  mode={kbMode}
                  onKey={onKey}
                  onBackspace={onBackspace}
                  showAccessory={step === "info" && kbMode === "number"}
                  onPrevious={step === "info" ? onKbPrevious : undefined}
                  onNext={step === "info" ? onKbNext : undefined}
                  onDone={step === "info" ? onKbDone : undefined}
                  bottomInset={insets.bottom}
                />
              </>
            ) : (
              <View style={{ height: insets.bottom }} />
            )}
          </>
        )}
        <StateSheet
          open={stateSheetOpen}
          onSelect={(abbr) => {
            setStateVal(abbr);
            setStateSheetOpen(false);
            // Choosing a state is the last address-field transition: move focus
            // directly to ZIP, reveal the numeric keyboard, and keep the Done
            // CTA above it rather than leaving the user to find the next field.
            focusField("zip");
          }}
          onClose={() => setStateSheetOpen(false)}
          bottomInset={insets.bottom}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: geist.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: "#fff",
  },
  sub: {
    fontFamily: geist.regular,
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
    marginTop: 10,
  },
  fieldLabel: {
    fontFamily: geist.medium,
    fontSize: 14,
    color: "#fff",
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    outlineColor: "transparent",
    outlineOffset: 0,
    outlineWidth: 0,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#121314",
  },
  inputText: {
    fontFamily: geist.regular,
    fontSize: 15,
    color: "#fff",
  },
  codeBox: {
    width: 56,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
