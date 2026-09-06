import "@/lib/sim/geistFonts";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { Stack, withLayoutContext } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RetroSettingsFab } from "@/components/sim/RetroSettingsFab";
import { ComboFab } from "@/components/sim/ComboFab";
import { AutoSellSheet } from "@/components/sim/AutoSellSheet";
import { CashOutSheet } from "@/components/sim/CashOutSheet";
import { BetSlipSheet } from "@/components/sim/BetSlipSheet";
import { PayWithHost } from "@/components/sim/PayWithSheet";
import { OnboardingFlow } from "@/components/sim/OnboardingFlow";
import { SocialTourOverlay } from "@/components/sim/SocialTourOverlay";
import { SlidesDemo } from "@/components/sim/SlidesDemo";
import { getSlidesKind } from "@/lib/sim/slidesDemo";
import { DesignSystemProvider } from "@/components/mm-proposal/DesignSystemProvider";
import colors from "@/constants/colors";
import { GEIST_FONT_MAP } from "@/lib/sim/geistFonts";
import { applyWebGeistFonts, applyWebTypeface } from "@/lib/sim/applyWebGeistFonts";
import { useTypeface } from "@/lib/sim/typefaceStore";
import { WEB_SAFE_AREA_METRICS } from "@/lib/sim/layout";
import { forPushFromLeft, forPushFromRight, stackSlideTransitionSpec } from "@/lib/sim/stackTransitions";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Native (iOS/Android) uses expo-router's native Stack, where
// `animation: "slide_from_right"` is honored by react-native-screens. On web,
// native-stack transitions are not executed (they are powered by native
// UIKit/Fragment animations), so the screens would appear instantly. To get the
// same slide-in on the web preview we swap in a JS-driven stack
// (@react-navigation/stack via withLayoutContext) with the SlideFromRightIOS
// transition preset. This branch is web-only; native behavior is unchanged.
const { Navigator } = createStackNavigator();
const JsStack = withLayoutContext(Navigator);

function RootLayoutNav() {
  if (Platform.OS === "web") {
    return (
      <JsStack
        screenOptions={{
          headerShown: false,
          // Reapply flex:1 — overriding cardStyle drops react-navigation's
          // default, otherwise the card grows with content and a flex:1
          // ScrollView never overflows (page can't scroll on web).
          cardStyle: { backgroundColor: colors.light.bg, flex: 1, overflow: "hidden" },
          ...TransitionPresets.SlideFromRightIOS,
          cardStyleInterpolator: forPushFromRight,
          gestureEnabled: false,
          // @react-navigation/stack disables screen animations on web by
          // default — without this the transitionSpec below never runs and
          // pushes appear as instant cuts.
          animation: "slide_from_right",
          transitionSpec: stackSlideTransitionSpec,
        }}
      >
        {/* Wallet sits "under" Predictions. When Predictions home has no stack
            to pop, it pushes wallet-home — slide_from_left makes that push
            read as an iOS pop (incoming from the left, current exits right).
            Normal detail pushes keep SlideFromRightIOS above. */}
        <JsStack.Screen
          name="wallet-home"
          options={{
            ...TransitionPresets.SlideFromLeftIOS,
            cardStyleInterpolator: forPushFromLeft,
            gestureEnabled: false,
            animation: "slide_from_left",
            transitionSpec: stackSlideTransitionSpec,
          }}
        />
        <JsStack.Screen name="social-profile" />
        <JsStack.Screen
          name="worldcup-bracket"
          options={{ ...TransitionPresets.ModalSlideFromBottomIOS, animation: "slide_from_bottom" }}
        />
        <JsStack.Screen name="_stress" options={{ title: "UI Stress Test" }} />
      </JsStack>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.light.bg },
        animation: "slide_from_right",
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wallet-home" options={{ animation: "slide_from_left" }} />
      <Stack.Screen name="trending" />
      <Stack.Screen name="topic/[id]" />
      <Stack.Screen name="esports" />
      <Stack.Screen name="positions" />
      <Stack.Screen name="social-profile" />
      <Stack.Screen name="worldcup" />
      <Stack.Screen name="worldcup-bracket" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="wimbledon" />
      <Stack.Screen name="sports" />
      <Stack.Screen name="sports-leagues" />
      <Stack.Screen name="browse-leagues" />
      <Stack.Screen name="uxr-leagues" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="league/[id]" />
      <Stack.Screen name="politics" />
      <Stack.Screen name="crypto" />
      <Stack.Screen name="basketball" />
      <Stack.Screen name="tennis" />
      <Stack.Screen name="market" />
      <Stack.Screen name="_stress" options={{ title: "UI Stress Test" }} />
    </Stack>
  );
}

function TypefaceSync() {
  const typeface = useTypeface();
  useEffect(() => {
    applyWebTypeface(typeface);
  }, [typeface]);
  return null;
}

export default function RootLayout() {
  // Geist is bundled from @expo-google-fonts/geist and registered under both
  // Expo names (Geist_400Regular) and DS PostScript names (Geist-Regular).
  // Icon fonts use the package `.font` map first (same-origin on web). CDN
  // URLs remain as fallbacks when a local asset URL is unreachable (Expo Go).
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    // On web, Geist is loaded via /fonts/geist.css. Registering the same
    // families through expo-font injects a second @font-face that can 404 in
    // the phone iframe and win over the CSS — every RN Text then falls back
    // to Times. Native still needs the Expo font map.
    ...(Platform.OS === "web" ? {} : GEIST_FONT_MAP),
    feather: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf",
    },
    Feather: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf",
    },
    ionicons: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf",
    },
    Ionicons: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf",
    },
    "material-community": {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf",
    },
    MaterialCommunityIcons: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf",
    },
    material: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf",
    },
    MaterialIcons: {
      uri: "https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf",
    },
  });

  useEffect(() => {
    if (fontError) {
      // eslint-disable-next-line no-console
      console.warn("[fonts] load error:", fontError);
    }
    if (fontsLoaded) {
      // eslint-disable-next-line no-console
      console.log("[fonts] loaded ok");
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    applyWebGeistFonts();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  const slides = Platform.OS === "web" ? getSlidesKind() : null;

  return (
    <SafeAreaProvider initialMetrics={Platform.OS === "web" ? WEB_SAFE_AREA_METRICS : undefined}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DesignSystemProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.bg }}>
            <KeyboardProvider>
              <View style={{ flex: 1, backgroundColor: colors.light.bg }}>
                <TypefaceSync />
                <StatusBar style="light" />
                <RootLayoutNav />
                {slides ? null : <RetroSettingsFab />}
                {!slides || slides === "combo-sport" ? <ComboFab /> : null}
                <BetSlipSheet />
                <PayWithHost />
                <AutoSellSheet />
                <CashOutSheet />
                {slides ? null : <OnboardingFlow />}
                {slides ? null : <SocialTourOverlay />}
                <SlidesDemo />
              </View>
            </KeyboardProvider>
          </GestureHandlerRootView>
          </DesignSystemProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
