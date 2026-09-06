import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ContentVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  Text,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { PageHeader } from "@/components/PageHeader";
import { UxrPageScroll, UxrRow, UXR_SPORTS } from "@/components/sim/UxrBrowse";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { MM_PROPOSAL_BROWSE_CATEGORIES } from "@/components/mm-proposal/categories";
import { SportPageHeader } from "@/components/mm-proposal/SportPage";
import { SportsHubPage } from "@/components/mm-proposal/SportsHubPage";
import { SportLeagueAccordion } from "@/components/mm-proposal/SportLeagueAccordion";
import { UXR_ICONS, UXR_MATERIAL_ICONS, UXR_MCI_ICONS } from "@/lib/sim/uxrIcons";
import { useCategoryTileStyle } from "@/lib/sim/categoryTileStore";
import { useNavMode } from "@/lib/sim/navModeStore";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { useBrowseLeagues } from "@/lib/sim/browseLeaguesStore";
import { useSportsPageLayout } from "@/lib/sim/sportsPageLayoutStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { enterComboFlow } from "@/lib/sim/comboFlowStore";
import { colors } from "@/lib/sim/colors";

// Categories browse: topic hubs first, then an inline Sports section.
// Home Sports tile still opens ?sports=1 (sports-only). MLB / Esports stay
// home-tile shortcuts and are omitted here.
export default function UxrCategoriesScreen() {
  const router = useRouter();
  const { sports } = useLocalSearchParams<{ sports?: string }>();
  const sportsOnly = sports === "1";
  const material = useCategoryTileStyle() === "material";
  const navMode = useNavMode();
  const sportsIa = useSportsIa();
  const browseLeagues = useBrowseLeagues();
  const sportsPageLayout = useSportsPageLayout();
  const combinationsVisible = useCombinationsVisible();
  const sportsHub = sportsOnly && sportsPageLayout === "page";

  const openSport = (slug: string) => {
    router.push(
      (sportsIa === "polymarket-sport-pages" || navMode !== "single"
        ? `/uxr-sport/${slug}`
        : `/uxr-hub/sports?sub=${slug}`) as never,
    );
  };

  const sportRows = browseLeagues ? (
    <SportLeagueAccordion material={material} />
  ) : (
    <View>
      {UXR_SPORTS.map(({ slug, label, emoji }) => (
        <UxrRow
          key={slug}
          label={label}
          icon={UXR_ICONS[slug]}
          materialIcon={material ? UXR_MATERIAL_ICONS[slug] : undefined}
          mciIcon={material ? UXR_MCI_ICONS[slug] : undefined}
          emoji={emoji}
          onPress={() => openSport(slug)}
        />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {sportsHub ? null : sportsOnly ? (
        <SportPageHeader title="Sports" onBack={() => router.back()} />
      ) : (
        <PageHeader title="Explore" showSearch={false} comboHeader={false} />
      )}
      {sportsHub ? (
        <SportsHubPage />
      ) : (
        <UxrPageScroll>
          {sportsOnly ? (
            sportRows
          ) : (
            <View>
              {combinationsVisible ? (
                <ListItem
                  isInteractive
                  variant={ContentVariant.OneLine}
                  title="Combos"
                  accessoryGap={3}
                  startAccessory={<HeaderComboMark pop={false} />}
                  endAccessory={
                    <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconAlternative} />
                  }
                  onPress={() => {
                    enterComboFlow();
                    router.push("/combination" as never);
                  }}
                />
              ) : null}
              {MM_PROPOSAL_BROWSE_CATEGORIES.map((category) => (
                <ListItem
                  key={category.id}
                  isInteractive
                  variant={ContentVariant.OneLine}
                  title={category.label}
                  accessoryGap={3}
                  startAccessory={
                    category.iconName ? (
                      <Icon name={category.iconName} size={IconSize.Md} color={IconColor.IconDefault} />
                    ) : null
                  }
                  endAccessory={
                    <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconAlternative} />
                  }
                  onPress={() => router.push(category.href as never)}
                />
              ))}
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                twClassName="px-4 pt-4 pb-1"
              >
                Sports
              </Text>
              {sportRows}
            </View>
          )}
        </UxrPageScroll>
      )}
    </View>
  );
}
