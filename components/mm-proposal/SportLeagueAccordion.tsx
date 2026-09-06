import { useState } from "react";
import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
} from "@metamask/design-system-react-native";

import { LeagueAvatar, UXR_SPORTS } from "@/components/sim/UxrBrowse";
import { UXR_ICONS, UXR_MATERIAL_ICONS, UXR_MCI_ICONS } from "@/lib/sim/uxrIcons";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";
import { colors } from "@/lib/sim/colors";

export function SportLeagueAccordion({
  material = false,
}: {
  material?: boolean;
}) {
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <View>
      {UXR_SPORTS.map((sport) => {
        const expanded = openSlug === sport.slug;
        const materialIcon = material ? UXR_MATERIAL_ICONS[sport.slug] : undefined;
        const mciIcon = material ? UXR_MCI_ICONS[sport.slug] : undefined;
        const imageIcon = UXR_ICONS[sport.slug];

        return (
          <View key={sport.slug}>
            <ListItem
              isInteractive
              variant={ContentVariant.OneLine}
              title={sport.label}
              accessoryGap={3}
              startAccessory={
                material && outlinedSportId(sport.slug) ? (
                  <MaterialOutlinedSportIcon name={sport.slug} size={22} color={colors.textPrimary} />
                ) : materialIcon != null ? (
                  <MaterialIcons name={materialIcon} size={22} color={colors.textPrimary} />
                ) : mciIcon != null ? (
                  <MaterialCommunityIcons name={mciIcon} size={22} color={colors.textPrimary} />
                ) : imageIcon != null ? (
                  <Image source={imageIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                ) : null
              }
              endAccessory={
                <Icon
                  name={expanded ? IconName.ArrowUp : IconName.ArrowDown}
                  size={IconSize.Sm}
                  color={IconColor.IconAlternative}
                />
              }
              onPress={() => setOpenSlug(expanded ? null : sport.slug)}
            />
            {expanded
              ? sport.leagues.map((league) => (
                  <ListItem
                    key={league.name}
                    isInteractive
                    variant={ContentVariant.OneLine}
                    title={league.name}
                    accessoryGap={3}
                    startAccessory={<LeagueAvatar uri={league.avatar} />}
                    endAccessory={
                      <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconAlternative} />
                    }
                    onPress={() =>
                      router.push(
                        `/uxr-sport/${sport.slug}?league=${encodeURIComponent(league.name)}` as never,
                      )
                    }
                    twClassName="pl-11"
                  />
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
}
