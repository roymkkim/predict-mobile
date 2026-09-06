import { Platform, StyleSheet } from "react-native";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";

// MetaMask DS Text uses PostScript names (Geist-Regular). Custom RN Text uses
// Expo Google Fonts names (Geist_400Regular). Native loads both via expo-font.
// Web loads the faces from /fonts/geist.css and must use a stack that starts
// with the DS name plus sans-serif — Expo names alone fall back to Times.
export const GEIST_FONT_MAP = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  "Geist-Regular": Geist_400Regular,
  "Geist-Medium": Geist_500Medium,
  "Geist-SemiBold": Geist_600SemiBold,
  "Geist-RegularItalic": Geist_400Regular,
  "Geist-MediumItalic": Geist_500Medium,
  "Geist-SemiBoldItalic": Geist_600SemiBold,
  "MMSans-Regular": Geist_400Regular,
  "MMSans-Medium": Geist_500Medium,
  "MMSans-Bold": Geist_600SemiBold,
  "MMPoly-Regular": Geist_400Regular,
};

function webStack(dsName: string, expoName: string) {
  return `"${dsName}", "${expoName}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

export const geist = {
  regular: Platform.select({
    web: webStack("Geist-Regular", "Geist_400Regular"),
    default: "Geist_400Regular",
  })!,
  medium: Platform.select({
    web: webStack("Geist-Medium", "Geist_500Medium"),
    default: "Geist_500Medium",
  })!,
  semibold: Platform.select({
    web: webStack("Geist-SemiBold", "Geist_600SemiBold"),
    default: "Geist_600SemiBold",
  })!,
  bold: Platform.select({
    web: webStack("Geist-Bold", "Geist_700Bold"),
    default: "Geist_700Bold",
  })!,
};

const EXPO_TO_STACK: Record<string, string> = {
  Geist_400Regular: geist.regular,
  Geist_500Medium: geist.medium,
  Geist_600SemiBold: geist.semibold,
  Geist_700Bold: geist.bold,
};

function remapFamily(family: unknown): unknown {
  if (typeof family !== "string") return family;
  const first = family.split(",")[0]?.replace(/['"]/g, "").trim();
  return (first && EXPO_TO_STACK[first]) || family;
}

function remapStyles<T extends Record<string, unknown>>(styles: T): T {
  const next = {} as T;
  for (const key of Object.keys(styles) as (keyof T)[]) {
    const value = styles[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const item = { ...(value as Record<string, unknown>) };
      if ("fontFamily" in item) item.fontFamily = remapFamily(item.fontFamily);
      next[key] = item as T[keyof T];
    } else {
      next[key] = value;
    }
  }
  return next;
}

if (Platform.OS === "web") {
  const originalCreate = StyleSheet.create.bind(StyleSheet) as (styles: unknown) => unknown;
  (StyleSheet as { create: (styles: unknown) => unknown }).create = (styles) =>
    originalCreate(remapStyles(styles as Record<string, unknown>));
}
