import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PoliticsCard } from "@/components/sim/PoliticsCard";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { ComboTray } from "@/components/sim/ComboTray";
import { StickyPageChrome } from "@/components/sim/StickyDetailScroll";
import { UxrCardProviders, UxrPageScroll, UXR_SPORTS } from "@/components/sim/UxrBrowse";
import { SportPageHeader } from "@/components/mm-proposal/SportPage";
import { MatchCard } from "@/lib/sim/topicMarkets";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { FEED_SECTION_GAP, PAGE_BODY_TOP_PADDING } from "@/lib/sim/layout";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { useComboMode, withComboQuery } from "@/lib/sim/comboFlowStore";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { sportsHubPillsFromSports } from "@/lib/sim/sportsHubPills";
import { sportsHubSections, type SportsHubCard } from "@/lib/sim/sportsHubFeed";

function SportCategoryPills() {
  const router = useRouter();
  const comboMode = useComboMode();
  const pills = sportsHubPillsFromSports(UXR_SPORTS);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 28, gap: 8 }}
    >
      {pills.map((pill) => (
        <Pressable
          key={pill.key}
          accessibilityRole="button"
          accessibilityLabel={pill.label}
          onPress={() => router.push((comboMode ? withComboQuery(pill.href) : pill.href) as never)}
          style={{
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.surface,
            ...(Platform.OS === "web" ? ({ cursor: "pointer" } as Record<string, string>) : null),
          }}
        >
          <Text
            style={{
              fontFamily: geist.medium,
              fontSize: 16,
              lineHeight: 24,
              color: colors.textPrimary,
            }}
          >
            {pill.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SportsHubCardNode({ card, combo }: { card: SportsHubCard; combo: boolean }) {
  const router = useRouter();
  if (card.kind === "match") {
    return (
      <Pressable onPress={() => router.push(matchDetailHref(card.match) as Href)}>
        <MatchCard m={card.match} layout="global" combo={combo} />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/prediction-detail",
          params: { pm: card.market.question, ...(combo ? { combo: "1" } : {}) },
        })
      }
    >
      <PoliticsCard
        market={card.market}
        cardPadding="12"
        metaStyle="filled"
        metaPlacement="bottom"
        buttonText="gray-colored"
        buttonSize="md"
        buttonStyle="default"
        buttonAnim="slot"
        showAvatar
        combo={combo}
      />
    </Pressable>
  );
}

/** Politics-style Sports landing: category pills + sectioned cards. */
export function SportsHubPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboSheetH = useComboSheetHeight();
  const sections = sportsHubSections();

  return (
    <UxrCardProviders>
      <View style={{ flex: 1 }}>
        <StickyPageChrome paddingBottom={12}>
          <SportPageHeader title="Sports" onBack={() => router.back()} />
          <SportCategoryPills />
        </StickyPageChrome>
        <UxrPageScroll
          contentTopPadding={PAGE_BODY_TOP_PADDING}
          contentGap={FEED_SECTION_GAP}
          contentBottomPadding={comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, 112)}
        >
          {sections.map((section) => (
            <View key={section.title} style={{ gap: 4 }}>
              <SectionHeader
                title={section.title}
                onPress={() => router.push((comboMode ? withComboQuery(section.href) : section.href) as never)}
              />
              <View style={{ gap: 12, paddingHorizontal: 16 }}>
                {section.cards.map((card) => (
                  <SportsHubCardNode
                    key={card.kind === "match" ? matchDetailHref(card.match) : card.market.question}
                    card={card}
                    combo={comboMode}
                  />
                ))}
              </View>
            </View>
          ))}
        </UxrPageScroll>
        {comboMode ? <ComboTray returnTo="/combination" dismissible /> : null}
      </View>
    </UxrCardProviders>
  );
}
