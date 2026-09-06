import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from "@metamask/design-system-react-native";

import { SPORTS_GAMES } from "@/components/sim/LiveCardsCarousel";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { PRESS_SECRETARY_MARKET } from "@/lib/sim/data";
import { TOPICS } from "@/lib/sim/topicMarkets";
import { colors } from "@/lib/sim/colors";
import { TEXT_FIELD_INPUT_PROPS } from "@/lib/sim/dsTextField";
import { screenTopInset } from "@/lib/sim/layout";

type Hit = { title: string; href: string; keywords?: string; logo?: string; flag?: string };

function allHits(): Hit[] {
  const fromSports = SPORTS_GAMES.map((game) => ({
    title: game.title,
    href: game.sport === "soccer" ? "/match-detail" : `/game-detail`,
    logo: game.teams[0]?.logo,
  }));
  const fromTopics = Object.values(TOPICS).flatMap((topic) =>
    topic.kind === "binary"
      ? topic.data.map((item) => ({
          title: item.title,
          href: `/prediction-detail?pm=${encodeURIComponent(item.title)}`,
        }))
      : topic.data.map((match) => ({
          title: `${match.teams[0].name} vs. ${match.teams[1].name}`,
          href: "/match-detail",
          logo: match.teams[0]?.logo,
          flag: match.teams[0]?.flag,
        })),
  );
  const fromPolitics = [
    {
      title: PRESS_SECRETARY_MARKET.question,
      href: `/prediction-detail?pm=${encodeURIComponent(PRESS_SECRETARY_MARKET.question)}`,
      keywords: PRESS_SECRETARY_MARKET.outcomes.map((o) => o.label).join(" "),
    },
  ];
  return [...fromPolitics, ...fromSports, ...fromTopics];
}

export function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = allHits();
    if (!q) return source.slice(0, 8);
    return source
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) || (item.keywords ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [query]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Box twClassName="flex-1 bg-default" style={{ paddingTop: screenTopInset(insets.top), backgroundColor: colors.bg }}>
        <Box twClassName="flex-row items-center gap-2 px-4 pb-3">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onPress={() => {
              setQuery("");
              onClose();
            }}
          />
          <Box twClassName="flex-1">
            <TextFieldSearch
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              onPressClearButton={() => setQuery("")}
              inputProps={TEXT_FIELD_INPUT_PROPS}
            />
          </Box>
        </Box>
        <ScrollView keyboardShouldPersistTaps="handled">
          {hits.length === 0 ? (
            <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative} twClassName="px-4 py-8 text-center">
              No markets match that search
            </Text>
          ) : (
            hits.map((hit) => (
              <Pressable
                key={hit.title}
                onPress={() => {
                  onClose();
                  setQuery("");
                  router.push(hit.href as never);
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <PositionAvatar market={hit.title} title={hit.title} logo={hit.logo} flag={hit.flag} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant={TextVariant.BodyMd} numberOfLines={2}>
                    {hit.title}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Box>
    </Modal>
  );
}
