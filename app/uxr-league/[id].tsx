import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import {
  leagueGames,
  leagueProps,
  UxrCardProviders,
  UxrGameGroups,
  UxrPageScroll,
  UxrPropsList,
  UxrTabs,
} from "@/components/sim/UxrBrowse";
import { ComboGameCard, ComboPropCard, type ComboCategoryInfo } from "@/components/sim/ComboGameCard";
import { ComboSpreadCard } from "@/components/sim/ComboSpreadCard";
import { ComboSheet } from "@/components/sim/ComboSheet";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { enterComboFlow, exitComboFlow, useComboMode } from "@/lib/sim/comboFlowStore";
import { clearComboPicks, removeComboPick, replaceComboPick, toggleComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import { matchToComboGame } from "@/lib/sim/comboData";
import { UXR_ICONS } from "@/lib/sim/uxrIcons";
import { colors } from "@/lib/sim/colors";
import { ComboMark } from "@/components/sim/ComboMark";
import { useLeaguePageVariant } from "@/lib/sim/leaguePageVariantStore";
import { geist } from "@/lib/sim/geistFonts";
import { SEGMENTED_THUMB_RADIUS, SEGMENTED_TRACK_RADIUS } from "@/components/sim/SegmentedControl";

// Market-type tabs (mirrors the combination page): Moneyline shows the game
// cards, the line markets show the spread-style line cards, Props keeps the
// prop list.
type Tab = "games" | "spread" | "total" | "rfi" | "hrs" | "ks" | "props";
type BetMode = "single" | "combo";

function leagueCategory(name: string): ComboCategoryInfo {
  if (name === "NFL" || name.includes("Football")) return { label: name, icon: UXR_ICONS.nfl };
  if (name === "NBA" || name.includes("Basketball")) return { label: name, icon: UXR_ICONS.basketball };
  if (name.includes("ATP") || name.includes("WTA")) return { label: name, icon: UXR_ICONS.tennis };
  if (name.includes("World Cup") || name.includes("League") || name.includes("Liga")) return { label: name, icon: UXR_ICONS.soccer };
  return { label: name, icon: UXR_ICONS.football };
}

// SINGLE / COMBO segmented pill per the mock.
function BetModeToggle({ mode, onChange }: { mode: BetMode; onChange: (m: BetMode) => void }) {
  return (
    <View style={{ flexDirection: "row", borderRadius: SEGMENTED_TRACK_RADIUS, backgroundColor: "#000000", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 3 }}>
      {(["single", "combo"] as const).map((m) => {
        const on = m === mode;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 12,
              height: 28,
              borderRadius: SEGMENTED_THUMB_RADIUS,
              // Selected segment matches the card background.
              backgroundColor: on ? colors.surface : "transparent",
            }}
          >
            {m === "combo" && <ComboMark size={16} color={on ? colors.textPrimary : colors.textMuted} />}
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 11,
                letterSpacing: 0.6,
                color: on ? colors.textPrimary : colors.textMuted,
              }}
            >
              {m.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// UXR-only league page (e.g. NFL): Games / Props tabs with date-grouped cards.
// The SINGLE/COMBO toggle switches the game cards into combo-building mode
// with the docked combo slip (Next disabled until something is picked).
export default function UxrLeagueScreen() {
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboSheetH = useComboSheetHeight();
  const name = typeof id === "string" ? decodeURIComponent(id) : "League";
  const [tab, setTab] = React.useState<Tab>("games");
  const comboMode = useComboMode();
  const [mode, setMode] = React.useState<BetMode>(modeParam === "combo" ? "combo" : "single");
  const picks = useComboPicks();

  // "combined" (default): no SINGLE/COMBO switcher — everything is
  // combinable by default, with a banner up top. "switcher" keeps the toggle.
  const combined = useLeaguePageVariant() === "combined";
  const combo = combined || comboMode || mode === "combo";
  const category = leagueCategory(name);
  const selected = (pickId: string) => comboOutcomeOn(picks, pickId);
  const toggle = toggleComboPick;

  const groups = leagueGames(name);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="" />
      <UxrPageScroll contentBottomPadding={comboListPaddingBottom(combo, comboSheetH, insets.bottom, 48)}>
        {/* Header per mock: big left-aligned league title with the SINGLE/COMBO
            switch beside it, then the Games/Props tabs on their own row. */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Text style={{ fontFamily: geist.bold, fontSize: 28, lineHeight: 34, color: colors.textPrimary }} numberOfLines={1}>
            {name}
          </Text>
          {!combined && (
            <BetModeToggle
              mode={comboMode || mode === "combo" ? "combo" : "single"}
              onChange={(m) => {
                setMode(m);
                if (m === "combo") enterComboFlow();
                else exitComboFlow();
              }}
            />
          )}
        </View>
        {/* No "you can bet on multiple markets" banner — combinations are inherent. */}
        <View style={{ paddingHorizontal: 16 }}>
          <UxrTabs<Tab>
            tabs={[
              { key: "games", label: "Moneyline" },
              { key: "spread", label: "Spread" },
              { key: "total", label: "Total" },
              { key: "rfi", label: "RFI" },
              { key: "hrs", label: "HRs" },
              { key: "ks", label: "K's" },
              { key: "props", label: "Props" },
            ]}
            active={tab}
            onChange={setTab}
            bare
          />
        </View>
        <UxrCardProviders>
          {tab === "games" ? (
            combo ? (
              <View style={{ gap: 16, paddingHorizontal: 16 }}>
                {groups.map((g) => (
                  <View key={g.title} style={{ gap: 10 }}>
                    <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: "#9B9B9B", paddingHorizontal: 4 }}>
                      {g.title}
                    </Text>
                    <View style={{ gap: 12 }}>
                      {g.matches.map((m, i) => {
                        const cg = matchToComboGame(m);
                        return (
                        <ComboGameCard
                          key={`${g.title}-${i}`}
                          game={cg}
                          category={category}
                          selected={selected}
                          onToggle={toggle}
                          onOpen={
                            m.teams.some((t) => t.name === "Panthers") && m.teams.some((t) => t.name === "Cardinals")
                              ? () => {
                                  // Carry the tapped pill into the detail page so
                                  // the moneyline arrives pre-selected.
                                  const tapped = cg.teams.find((t) => selected(`${cg.id}:${t.abbr}`));
                                  router.push(
                                    tapped ? `/game-detail?pick=${tapped.abbr.toLowerCase()}` : "/game-detail",
                                  );
                                }
                              : undefined
                          }
                        />
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <UxrGameGroups groups={groups} />
            )
          ) : tab !== "props" ? (
            // Line markets (Spread/Total/RFI/HRs/K's): one line card per game.
            // Keyed by tab so switching markets resets each card's line state.
            <View style={{ gap: 12, paddingHorizontal: 16 }}>
              {groups.flatMap((g) =>
                g.matches.map((m, i) => {
                  const cg = matchToComboGame(m);
                  return (
                    <ComboSpreadCard
                      key={`${tab}-${g.title}-${i}`}
                      game={cg}
                      category={category}
                      selected={selected}
                      onToggle={toggle}
                      kind={tab as "spread" | "total" | "rfi" | "hrs" | "ks"}
                      onOpen={() => router.push("/game-detail")}
                    />
                  );
                }),
              )}
            </View>
          ) : combo ? (
            <View style={{ gap: 12, paddingHorizontal: 16 }}>
              {leagueProps(name).map((p) => (
                <ComboPropCard key={p.title} prop={p} category={category} selected={selected} onToggle={toggle} />
              ))}
            </View>
          ) : (
            <UxrPropsList props={leagueProps(name)} />
          )}
        </UxrCardProviders>
      </UxrPageScroll>
      {combo && (
        <ComboSheet
          docked
          picks={picks}
          onRemove={removeComboPick}
          onReplace={replaceComboPick}
          onClear={clearComboPicks}
        />
      )}
    </View>
  );
}
