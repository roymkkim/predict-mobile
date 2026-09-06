import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  HeaderStandard,
  IconName,
} from "@metamask/design-system-react-native";

import { colors, uxrPaletteColor } from "@/lib/sim/colors";
import { ShareableTradeCard, type ShareableTrade } from "@/components/sim/ShareableTradeCard";
import { IosShareSheet, shareMessage } from "@/components/sim/IosShareSheet";
import { AmbientBrandGradient, BRAND_ON_GRADIENT } from "@/components/sim/AmbientBrandGradient";
import { closeAutoSell, openAutoSell } from "@/lib/sim/autoSellStore";
import { screenTopInset } from "@/lib/sim/layout";
import { useSocialUx } from "@/lib/sim/socialUxStore";
import { useSuccessScreenStyle } from "@/lib/sim/successScreenStore";
import { inferDetailHref } from "@/lib/sim/marketRoutes";
import { geist } from "@/lib/sim/geistFonts";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";

export default function TradeSubmittedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const socialUx = useSocialUx();
  const wash = useSuccessScreenStyle() === "gradient";
  const betR = useBetRadius();
  const { market, title, color, cost, toWin, kind, orderType, returnTo, logo, flag } = useLocalSearchParams<{
    market?: string;
    title?: string;
    color?: string;
    cost?: string;
    toWin?: string;
    kind?: string;
    orderType?: string;
    returnTo?: string;
    logo?: string;
    flag?: string;
  }>();

  const tint = typeof color === "string" && color ? uxrPaletteColor(color) : colors.green;
  const combo = kind === "combo";
  const logoUri = typeof logo === "string" && logo ? logo : undefined;
  const flagUri = typeof flag === "string" && flag ? flag : undefined;
  const costN = parseFloat(cost ?? "") || 0;
  const toWinN = parseFloat(toWin ?? "") || 0;
  const detailHref =
    (typeof returnTo === "string" && returnTo) || inferDetailHref(typeof market === "string" ? market : undefined);
  const goPositions = () => router.replace("/positions" as never);
  const trade: ShareableTrade = {
    market: typeof market === "string" ? market : undefined,
    title: typeof title === "string" ? title : undefined,
    cost: costN,
    toWin: toWinN,
    logo: logoUri,
    flag: flagUri,
    combo,
  };

  React.useEffect(() => {
    if (orderType !== "limit") return;
    const t = setTimeout(() => openAutoSell({ tint, cost: costN, toWin: toWinN, detailHref: typeof returnTo === "string" && returnTo ? returnTo : undefined }), 550);
    return () => {
      clearTimeout(t);
      closeAutoSell();
    };
  }, [orderType]);

  if (socialUx) {
    return <SocialSubmitted trade={trade} returnTo={detailHref} wash={wash} />;
  }

  const ink = wash ? BRAND_ON_GRADIENT : colors.textPrimary;
  return (
    <View style={{ flex: 1, backgroundColor: "#000000", paddingTop: insets.top, paddingBottom: 40 }}>
      {wash ? <AmbientBrandGradient style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Ionicons name="checkmark-sharp" size={44} color={colors.green} />
        <Text style={{ fontFamily: geist.semibold, fontSize: 22, lineHeight: 28, color: ink }}>
          Trade submitted!
        </Text>
      </View>
      <View style={{ marginHorizontal: 16 }}>
        <ShareableTradeCard trade={trade} showAuthor={false} />
      </View>
      <View style={{ marginTop: 16, marginHorizontal: 16 }}>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isInverse={wash}
          onPress={goPositions}
          twClassName={betR === 999 ? "rounded-full" : undefined}
          style={{ borderRadius: betR }}
        >
          View positions
        </Button>
      </View>
    </View>
  );
}

function SocialSubmitted({
  trade,
  returnTo,
  wash,
}: {
  trade: ShareableTrade;
  returnTo?: string;
  wash: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const betR = useBetRadius();
  const [shareOpen, setShareOpen] = useState(false);

  const openComposer = () => {
    router.push({
      pathname: "/share-post",
      params: {
        market: trade.market ?? "",
        title: trade.title ?? "",
        cost: String(trade.cost),
        toWin: String(trade.toWin),
        logo: trade.logo ?? "",
        flag: trade.flag ?? "",
        combo: trade.combo ? "1" : "",
        returnTo: returnTo ?? "",
      },
    });
  };
  const topInset = screenTopInset(insets.top);
  const ink = wash ? BRAND_ON_GRADIENT : colors.textPrimary;

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      {wash ? <AmbientBrandGradient style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
      {wash ? (
        <View style={{ paddingTop: topInset, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={26} color={ink} />
          </Pressable>
          <Pressable
            onPress={() => setShareOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share trade"
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="share-outline" size={22} color={ink} />
          </Pressable>
        </View>
      ) : (
        <View style={{ paddingTop: topInset }}>
          <HeaderStandard
            title="Submitted trade"
            onBack={() => router.back()}
            endAccessory={
              <ButtonIcon
                iconName={IconName.Share}
                size={ButtonIconSize.Md}
                onPress={() => setShareOpen(true)}
                accessibilityLabel="Share trade"
              />
            }
          />
        </View>
      )}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Ionicons name="checkmark-sharp" size={44} color={colors.green} />
        <Text style={{ fontFamily: geist.semibold, fontSize: 22, lineHeight: 28, color: ink }}>
          Trade submitted!
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <ShareableTradeCard trade={trade} showAuthor={false} />
      </View>
      <View style={{ marginTop: 16, paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          isInverse={wash}
          onPress={() => router.replace("/positions" as never)}
          twClassName={betR === 999 ? "rounded-full" : undefined}
          style={{ borderRadius: betR }}
        >
          View positions
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isInverse={wash}
          onPress={openComposer}
          twClassName={betR === 999 ? "rounded-full" : undefined}
          style={{ borderRadius: betR }}
        >
          Share trade
        </Button>
      </View>
      <IosShareSheet visible={shareOpen} message={shareMessage(trade.market, trade.title)} onClose={() => setShareOpen(false)} />
    </View>
  );
}
