import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ContentVariant,
  FilterButton,
  FilterButtonSize,
  FilterButtonVariant,
  HeaderStandard,
  IconName,
  ListItemSelect,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import type { SportsNavVariant } from "@/lib/sim/sportsNavExperimentStore";

export const SPORT_MARKET_FILTERS = [
  { key: "games", label: "Games" },
  { key: "props", label: "Props" },
  { key: "to-advance", label: "To Advance" },
  { key: "futures", label: "Futures" },
  { key: "awards", label: "Awards" },
  { key: "host", label: "Host" },
  { key: "league-leader", label: "League Leader" },
] as const;

export type SportMarketFilter = (typeof SPORT_MARKET_FILTERS)[number]["key"];

/** Same transparent-border override the Live / league carousel chips use. */
export const FILTER_CHIP_STYLE = { borderWidth: 1, borderColor: "transparent" } as const;

const CLOSE_PAD = 16;
const CLOSE_HIT = 40;
const CLOSE_GAP = 8;
const FADE_EXTRA = 28;
const CLOSE_SCROLL_INSET = CLOSE_PAD + CLOSE_HIT + CLOSE_GAP;
const CLOSE_FADE_WIDTH = CLOSE_PAD + CLOSE_HIT + FADE_EXTRA;

function CloseControl({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ height: CLOSE_HIT, width: CLOSE_HIT, alignItems: "center", justifyContent: "center" }}>
      <ButtonIcon iconName={IconName.Close} size={ButtonIconSize.Md} onPress={onPress} />
    </View>
  );
}

function PickerSheet({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Box twClassName="flex-1 justify-end bg-overlay-default">
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Box twClassName="max-h-[70%] rounded-t-2xl bg-background-default">
          <HeaderStandard title={title} onClose={onClose} />
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Box>
      </Box>
    </Modal>
  );
}

function DropdownChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <FilterButton
      isSelected
      size={FilterButtonSize.Md}
      variant={FilterButtonVariant.Secondary}
      endIconName={IconName.ArrowDown}
      onPress={onPress}
      textProps={{ numberOfLines: 1 }}
      style={FILTER_CHIP_STYLE}
    >
      {label}
    </FilterButton>
  );
}

export function SportsNavChrome({
  variant,
  league,
  leagues,
  marketFilter,
  onClear,
  onSelectLeague,
  onSelectMarket,
}: {
  variant: SportsNavVariant;
  league: string;
  leagues: { name: string }[];
  marketFilter: SportMarketFilter;
  onClear: () => void;
  onSelectLeague: (name: string) => void;
  onSelectMarket: (filter: SportMarketFilter) => void;
}) {
  const [leagueOpen, setLeagueOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const marketLabel =
    SPORT_MARKET_FILTERS.find((item) => item.key === marketFilter)?.label ?? "Games";

  return (
    <>
      {variant === "dropdowns" ? (
        <Box twClassName="flex-row flex-nowrap items-center gap-2 px-4">
          <CloseControl onPress={onClear} />
          <DropdownChip label={league} onPress={() => setLeagueOpen(true)} />
          <DropdownChip label={marketLabel} onPress={() => setMarketOpen(true)} />
        </Box>
      ) : (
        <View style={{ position: "relative", minHeight: CLOSE_HIT }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingLeft: CLOSE_SCROLL_INSET,
              paddingRight: 16,
              alignItems: "center",
              minHeight: CLOSE_HIT,
            }}
          >
            <DropdownChip label={league} onPress={() => setLeagueOpen(true)} />
            {SPORT_MARKET_FILTERS.map((item) => (
              <FilterButton
                key={item.key}
                size={FilterButtonSize.Md}
                variant={FilterButtonVariant.Secondary}
                isSelected={marketFilter === item.key}
                onPress={() => onSelectMarket(item.key)}
                style={FILTER_CHIP_STYLE}
              >
                {item.label}
              </FilterButton>
            ))}
          </ScrollView>
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: CLOSE_FADE_WIDTH,
              justifyContent: "center",
            }}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[colors.bg, colors.bg, "transparent"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, right: 0 }}
            />
            <View style={{ paddingLeft: CLOSE_PAD }}>
              <CloseControl onPress={onClear} />
            </View>
          </View>
        </View>
      )}

      <PickerSheet title="League" visible={leagueOpen} onClose={() => setLeagueOpen(false)}>
        {leagues.map((item) => (
          <ListItemSelect
            key={item.name}
            isSelected={item.name === league}
            showSelectedIcon
            variant={ContentVariant.OneLine}
            title={item.name}
            onPress={() => {
              onSelectLeague(item.name);
              setLeagueOpen(false);
            }}
          />
        ))}
      </PickerSheet>

      <PickerSheet title="Markets" visible={marketOpen} onClose={() => setMarketOpen(false)}>
        {SPORT_MARKET_FILTERS.filter((item) => item.key === "games" || item.key === "props").map(
          (item) => (
            <ListItemSelect
              key={item.key}
              isSelected={marketFilter === item.key}
              showSelectedIcon
              variant={ContentVariant.OneLine}
              title={item.label}
              onPress={() => {
                onSelectMarket(item.key);
                setMarketOpen(false);
              }}
            />
          ),
        )}
      </PickerSheet>
    </>
  );
}
