import { useEffect } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from "@metamask/design-system-react-native";

import { PRESS_SECRETARY_MARKET } from "@/lib/sim/data";
import { screenTopInset } from "@/lib/sim/layout";
import {
  SOCIAL_TOUR_COPY,
  SOCIAL_TOUR_STEPS,
  socialTourBack,
  socialTourNext,
  stopSocialTour,
  useSocialTour,
  type SocialTourStepId,
} from "@/lib/sim/socialTourStore";

const GUTTER = 16;
const TOP_GAP = 12;

function marketTabForStep(stepId: SocialTourStepId): "social" | "chat" | "live" | null {
  if (stepId === "socialFeed") return "social";
  if (stepId === "liveChat") return "chat";
  if (stepId === "liveTrades") return "live";
  return null;
}

function onPredictionsHome(pathname: string): boolean {
  return pathname === "/" || pathname === "/index" || pathname === "/(tabs)" || pathname === "/(tabs)/index";
}

export function SocialTourOverlay() {
  const tour = useSocialTour();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();

  const copy = SOCIAL_TOUR_COPY[tour.stepId];
  const cardW = Math.min(300, Math.max(0, winW - GUTTER * 2));

  useEffect(() => {
    if (!tour.active) return;
    if (tour.stepId === "latestPosts") {
      if (!onPredictionsHome(pathname)) {
        const t = setTimeout(() => {
          router.replace("/" as never);
        }, 80);
        return () => clearTimeout(t);
      }
      return;
    }
    const onMarket = pathname.includes("prediction-detail") || pathname.includes("market") || pathname.includes("game-detail");
    if (!onMarket) {
      const t = setTimeout(() => {
        router.push({
          pathname: "/prediction-detail",
          params: { pm: PRESS_SECRETARY_MARKET.question, tab: marketTabForStep(tour.stepId) ?? "social" },
        } as never);
      }, 80);
      return () => clearTimeout(t);
    }
    const tab = marketTabForStep(tour.stepId);
    if (tab) {
      const t = setTimeout(() => {
        router.setParams({ tab } as never);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [tour.active, tour.stepId, pathname, router]);

  if (!tour.active) return null;

  const last = tour.stepIndex >= SOCIAL_TOUR_STEPS.length - 1;
  const first = tour.stepIndex === 0;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 80 }}
    >
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: screenTopInset(insets.top) + TOP_GAP,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <View
          pointerEvents="auto"
          style={{
            alignSelf: "center",
            width: cardW,
            maxWidth: winW - GUTTER * 2,
            backgroundColor: "#18181B",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            padding: 14,
            gap: 10,
          }}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {copy.title}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {copy.body}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {tour.stepIndex + 1} / {SOCIAL_TOUR_STEPS.length}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
            <Pressable onPress={stopSocialTour} hitSlop={8} style={{ paddingVertical: 8, paddingRight: 8 }}>
              <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                Skip
              </Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            {!first ? (
              <Pressable onPress={socialTourBack} hitSlop={8} style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Back
                </Text>
              </Pressable>
            ) : null}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onPress={last ? stopSocialTour : socialTourNext}
            >
              {last ? "Done" : "Next"}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
