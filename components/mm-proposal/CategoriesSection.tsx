import {
  Box,
  Icon,
  IconColor,
  IconSize,
  SectionHeader,
} from "@metamask/design-system-react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { MM_PROPOSAL_CATEGORIES, MM_PROPOSAL_MORE_CATEGORY, type MmProposalCategory } from "./categories";
import { queueSportLeagueSelection } from "@/lib/sim/sportLeagueSelectStore";
import { colors } from "@/lib/sim/colors";
import { CombinationsCategoryTile } from "@/components/sim/CombinationsCategoryTile";
import { ExploreCategoryTile, EXPLORE_TILE_ICON } from "@/components/sim/ExploreCategoryTile";
import { MaterialOutlinedSportIcon } from "@/components/sim/MaterialSportsOutline";
import { useShowCombinationsTile } from "@/lib/sim/combinationsStore";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const TILE_GAP = 8;
const SIDE_PAD = 16;
// 393pt frame: three tiles plus ~65px of the fourth (icon + start of the label).
const TILE_W = 96;

function categoryIcon(category: MmProposalCategory) {
  // DS tiles use IconSize.Lg (24px) in the 26px optical box. ComboMark stays 26.
  if (category.id === "nfl") {
    return <MaterialOutlinedSportIcon name="football" size={24} color={colors.textPrimary} />;
  }
  if (category.id === "mlb") {
    return <MaterialOutlinedSportIcon name="baseball" size={24} color={colors.textPrimary} />;
  }
  if (category.communityIcon) {
    return (
      <MaterialCommunityIcons
        name={category.communityIcon}
        size={24}
        color={colors.textPrimary}
      />
    );
  }
  if (category.materialIcon) {
    return <MaterialIcons name={category.materialIcon} size={EXPLORE_TILE_ICON} color={colors.textPrimary} />;
  }
  if (category.iconName) {
    return <Icon name={category.iconName} size={IconSize.Lg} color={IconColor.IconDefault} />;
  }
  return null;
}

export function CategoriesSection() {
  const router = useRouter();
  const showComboTile = useShowCombinationsTile();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const tiles: readonly MmProposalCategory[] = [...MM_PROPOSAL_CATEGORIES, MM_PROPOSAL_MORE_CATEGORY];

  return (
    <Box>
      <SectionHeader
        title="Explore"
        isInteractive
        onPress={() => router.push("/uxr-categories" as never)}
        twClassName="px-4 pt-0 pb-3"
        titleProps={{ ...oswald, style: { fontFamily: displayFont } }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={TILE_W + TILE_GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{
          flexDirection: "row",
          gap: TILE_GAP,
          paddingHorizontal: SIDE_PAD,
        }}
      >
        {showComboTile ? <CombinationsCategoryTile variant="icon" width={TILE_W} /> : null}
        {tiles.map((category) => (
          <ExploreCategoryTile
            key={category.id}
            width={TILE_W}
            label={category.label}
            icon={categoryIcon(category)}
            onPress={() => {
              if (category.id === "nfl") {
                queueSportLeagueSelection("football", "NFL");
              }
              if (category.id === "mlb") {
                queueSportLeagueSelection("baseball", "MLB");
              }
              router.push(category.href as never);
            }}
          />
        ))}
      </ScrollView>
    </Box>
  );
}
