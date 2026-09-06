import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/lib/sim/colors";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useShowCombinationsBanner } from "@/lib/sim/combinationsStore";
import { PositionNotice } from "./HeroCarousel";
import { CombinationsBanner } from "./CombinationsBanner";
import { BALANCE } from "./MoneySheet";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

// Shared icon tint for the quick-action tiles.
const ACTION_ICON_COLOR = "#9b9b9b";

// Open-book glyph used for the Positions tile (provided by the user).
function BookIcon({ size = 22, color = ACTION_ICON_COLOR }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 16C7.28333 16 8.04583 16.0875 8.7875 16.2625C9.52917 16.4375 10.2667 16.7 11 17.05V7.2C10.3167 6.8 9.59167 6.5 8.825 6.3C8.05833 6.1 7.28333 6 6.5 6C5.9 6 5.30417 6.05833 4.7125 6.175C4.12083 6.29167 3.55 6.46667 3 6.7V16.6C3.58333 16.4 4.1625 16.25 4.7375 16.15C5.3125 16.05 5.9 16 6.5 16ZM13 17.05C13.7333 16.7 14.4708 16.4375 15.2125 16.2625C15.9542 16.0875 16.7167 16 17.5 16C18.1 16 18.6875 16.05 19.2625 16.15C19.8375 16.25 20.4167 16.4 21 16.6V6.7C20.45 6.46667 19.8792 6.29167 19.2875 6.175C18.6958 6.05833 18.1 6 17.5 6C16.7167 6 15.9417 6.1 15.175 6.3C14.4083 6.5 13.6833 6.8 13 7.2V17.05ZM12 20C11.2 19.3667 10.3333 18.875 9.4 18.525C8.46667 18.175 7.5 18 6.5 18C5.8 18 5.1125 18.0917 4.4375 18.275C3.7625 18.4583 3.11667 18.7167 2.5 19.05C2.15 19.2333 1.8125 19.225 1.4875 19.025C1.1625 18.825 1 18.5333 1 18.15V6.1C1 5.91667 1.04583 5.74167 1.1375 5.575C1.22917 5.40833 1.36667 5.28333 1.55 5.2C2.31667 4.8 3.11667 4.5 3.95 4.3C4.78333 4.1 5.63333 4 6.5 4C7.46667 4 8.4125 4.125 9.3375 4.375C10.2625 4.625 11.15 5 12 5.5C12.85 5 13.7375 4.625 14.6625 4.375C15.5875 4.125 16.5333 4 17.5 4C18.3667 4 19.2167 4.1 20.05 4.3C20.8833 4.5 21.6833 4.8 22.45 5.2C22.6333 5.28333 22.7708 5.40833 22.8625 5.575C22.9542 5.74167 23 5.91667 23 6.1V18.15C23 18.5333 22.8375 18.825 22.5125 19.025C22.1875 19.225 21.85 19.2333 21.5 19.05C20.8833 18.7167 20.2375 18.4583 19.5625 18.275C18.8875 18.0917 18.2 18 17.5 18C16.5 18 15.5333 18.175 14.6 18.525C13.6667 18.875 12.8 19.3667 12 20Z"
        fill={color}
      />
    </Svg>
  );
}

// "Prod" balance block — a large balance figure with a P&L meta line, a row of
// three quick-action tiles (Positions / Add funds / Withdraw), and a solid blue
// Claim-rewards CTA. Presentational only, mirroring the web reference.
const QUICK_ACTIONS: { label: string; icon: "book" | keyof typeof MaterialIcons.glyphMap; badge: string | null; route?: Href; money?: boolean }[] = [
  { label: "Positions", icon: "book", badge: "3", route: "/positions" },
  { label: "Add funds", icon: "add", badge: null, money: true },
  { label: "Withdraw", icon: "arrow-downward", badge: null, money: true },
];

export function ProdBalanceCard({ noticeDismissed = false, onCloseNotice }: { noticeDismissed?: boolean; onCloseNotice?: () => void } = {}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const { showClaim, showPositionBanner, positionBannerPlacement, headerBalance = true, openMoney } = useFeedSettings();
  const showCombinationsBanner = useShowCombinationsBanner();
  const router = useRouter();
  // Inline-notice dismissal is owned by Feed (so it can drop the empty card
  // slot when this is the only content); fall back to local state if unmanaged.
  const [localDismissed, setLocalDismissed] = useState(false);
  const dismissed = onCloseNotice ? noticeDismissed : localDismissed;
  const closeNotice = onCloseNotice ?? (() => setLocalDismissed(true));
  const showInlineNotice = showPositionBanner && positionBannerPlacement === "inline" && !dismissed;
  return (
    <View style={{ gap: 16 }}>
      {!headerBalance && (
      <View>
        <Text
          {...oswald}
          style={{
            fontFamily: displayFont,
            fontSize: 40,
            lineHeight: 40,
            color: colors.textPrimary,
            includeFontPadding: false,
            marginBottom: 0,
          }}
        >
          {BALANCE}
        </Text>
        <Text
          style={{
            fontFamily: geist.medium,
            fontSize: 14,
            lineHeight: 14,
            color: colors.textMuted,
            includeFontPadding: false,
            marginTop: 8,
          }}
        >
          Predict balance
        </Text>
      </View>
      )}

      {!headerBalance && (
      <View style={{ flexDirection: "row", gap: 8 }}>
        {QUICK_ACTIONS.map(({ label, icon, badge, route, money }) => (
          <Pressable
            key={label}
            onPress={() => {
              if (money && label === "Add funds") router.push("/add-funds" as Href);
              else if (money) router.push("/withdraw" as Href);
              else if (route) router.push(route);
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              borderRadius: 12,
              paddingTop: 12,
              paddingBottom: 16,
              backgroundColor: colors.surfaceTransparent,
              opacity: pressed && (route || money) ? 0.6 : 1,
            })}
          >
            <View style={{ position: "relative" }}>
              {icon === "book" ? (
                  <BookIcon size={24} color={colors.textMuted} />
              ) : (
                  <MaterialIcons name={icon} size={24} color={colors.textMuted} />
              )}
              {badge && (
                <View
                  style={{
                    position: "absolute",
                    right: -12,
                    top: -6,
                    width: 16,
                    height: 14,
                    borderRadius: 7,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.red,
                  }}
                >
                  <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 14, color: colors.bg }}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      )}

      {showCombinationsBanner ? <CombinationsBanner /> : null}

      {showInlineNotice && (
        <View style={{ paddingTop: 16 }}>
          <PositionNotice onClose={closeNotice} />
        </View>
      )}

      {showClaim && (
        <View style={{ paddingTop: 16 }}>
          <View style={{ height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#4459FF" }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 16, color: "#fff" }}>Claim $46.35</Text>
          </View>
        </View>
      )}
    </View>
  );
}
