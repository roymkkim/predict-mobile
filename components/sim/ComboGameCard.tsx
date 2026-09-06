import { Pressable, Text, View, Image, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { backgroundMuted, colors, marketAccentColor } from "@/lib/sim/colors";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { METAMASK_BUTTON_RADIUS } from "@/lib/sim/buttonStyle";
import { comboMoneyline, comboTeamMark, type ComboGame } from "@/lib/sim/comboData";
import { marketPeriod, soccerPeriodScopesForSport, scopeSlug } from "@/components/sim/MatchMarkets";
import type { Binary } from "@/lib/sim/topicMarkets";
import type { ComboPick } from "./ComboSheet";
import { LiveDot } from "./Crest";
import { useTopControls } from "@/lib/sim/feedTopControlsStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { VolumeText } from "@/components/sim/VolumeText";
import { CardBuildComboButton } from "@/components/sim/BuildComboButton";
import { useComboPageUnselectedChrome } from "@/lib/sim/comboFlowStore";
import { useLiveOdds } from "@/lib/sim/useLiveOdds";

function ComboTeamMark({ source, size }: { source?: ImageSourcePropType; size: number }) {
  if (!source) return <View style={{ width: size, height: size }} />;
  return <Image source={source} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="cover" />;
}

export type ComboCategoryInfo = { label: string; icon?: ImageSourcePropType; emoji?: string };

// COMBO variant of the binary prop card: date + question, Yes/No rows with
// colored underlines and multipliers, and %-chips that start muted and fill
// with the outcome color when picked.
export function ComboPropCard({
  prop,
  category,
  selected,
  onToggle,
}: {
  prop: Binary;
  category: ComboCategoryInfo;
  selected: (pickId: string) => boolean;
  onToggle: (pick: import("./ComboSheet").ComboPick) => void;
}) {
  const m = prop.match;
  const { showFooter } = useTopControls();
  const unselectedChrome = useComboPageUnselectedChrome();
  const pcts = m.teams.map((side) => parseInt(side.pct, 10) || 0);
  const { vals: liveVals } = useLiveOdds(pcts, true);
  return (
    <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 14, paddingBottom: showFooter ? 14 : 20, gap: 12 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>{m.date}</Text>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>{prop.title}</Text>
      </View>

      {m.teams.map((side, i) => {
        const pct = Math.round(liveVals[i] ?? (parseInt(side.pct, 10) || 0));
        // Default "No" grey reads dead in UXR — use the standard pink instead.
        const base = side.color === "#71717a" ? "#ff5fa2" : side.color;
        const fill = marketAccentColor(base);
        const id = `${prop.title}:${side.name}`;
        const on = selected(id);
        const other = m.teams[1 - i];
        const otherPct = parseInt(other.pct, 10);
        const otherBase = other.color === "#71717a" ? "#ff5fa2" : other.color;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>{side.name}</Text>
              <View
                style={{
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: fill,
                  opacity: 0.9,
                  alignSelf: "stretch",
                  maxWidth: `${Math.max(pct, 12)}%`,
                }}
              />
            </View>
            <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textMuted }}>
              {(100 / Math.max(pct, 1)).toFixed(2)}x
            </Text>
            <ComboSelectedButton
              selected={on}
              onPress={() =>
                onToggle({
                  id,
                  category: category.label,
                  categoryIcon: category.icon,
                  categoryEmoji: category.emoji,
                  label: `${side.name} \u00b7 ${prop.title}`,
                  color: fill,
                  cents: pct,
                  side: /no/i.test(side.name) ? "no" : "yes",
                  alt: {
                    id: `${prop.title}:${other.name}`,
                    label: `${other.name} \u00b7 ${prop.title}`,
                    color: marketAccentColor(otherBase),
                    cents: Number.isFinite(otherPct) ? otherPct : 100 - pct,
                  },
                })
              }
              label={`${pct}%`}
              slotValue={pct}
              slotSuffix="%"
              radius={METAMASK_BUTTON_RADIUS}
              height={40}
              minWidth={64}
              fontSize={15}
              fontFamily={geist.semibold}
              lineHeight={20}
              unselectedColor={fill}
              unselectedChrome={unselectedChrome}
              labelForInk={side.name}
            />
          </View>
        );
      })}

      {showFooter ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ height: 20, borderRadius: 6, backgroundColor: colors.surface2, justifyContent: "center", paddingHorizontal: 6 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>{m.league}</Text>
          </View>
          <VolumeText style={{ fontSize: 12, lineHeight: 16 }}>{m.vol}</VolumeText>
        </View>
      ) : null}
    </View>
  );
}

// Shared COMBO market card (used by /combination and the league pages' COMBO
// mode): LIVE clock header, helmet + underlined team rows with score chips,
// and two outcome buttons that start muted and fill with the team's palette
// color when selected.
export function ComboGameCard({
  game,
  category,
  selected,
  onToggle,
  onOpen,
}: {
  game: ComboGame;
  category: ComboCategoryInfo;
  selected: (pickId: string) => boolean;
  onToggle: (pick: ComboPick) => void;
  // Tapping the card header (title/scores) opens the game detail page.
  onOpen?: () => void;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const themeMode = useThemeMode();
  const { showFooter } = useTopControls();
  const unselectedChrome = useComboPageUnselectedChrome();
  const { home: homeBase, away: awayBase, draw: drawBase } = comboMoneyline(game);
  const threeWay = drawBase != null;
  const { vals: liveVals } = useLiveOdds(
    threeWay ? [homeBase, drawBase as number, awayBase] : [homeBase, awayBase],
    true,
  );
  const homePrice = Math.round(liveVals[0] ?? homeBase);
  const drawPrice = threeWay ? Math.round(liveVals[1] ?? drawBase) : undefined;
  const awayPrice = Math.round(liveVals[threeWay ? 2 : 1] ?? awayBase);
  const periodScopes = soccerPeriodScopesForSport(game.sport);
  const period = marketPeriod(periodScopes, 0);
  const periodKey = period ? `${scopeSlug(period)}:` : "";
  const barTotal = threeWay ? homePrice + (drawPrice ?? 0) + awayPrice : homePrice + awayPrice;
  const drawTint = backgroundMuted(themeMode);
  // Spacing per the CARDS 2.0 spec (361-wide card): 16 card padding, 48px
  // helmet slot on a 52px row pitch, name + 2px track underline (color fill
  // is partial for the trailing side), 32px score chip, 48px-tall buttons
  // (radius 19, 11 gap) 15px below the rows, footer 12px below the buttons.
  const fillHome = marketAccentColor(game.teams[0].color);
  const fillAway = marketAccentColor(game.teams[1].color);
  const vs = `${game.teams[0].name} vs ${game.teams[1].name}`;
  const outcomes: {
    key: string;
    abbr: string;
    fill: string;
    cents: number;
    label: string;
    pickLabel: string;
    slotPrefix: string;
  }[] = [
    { key: game.teams[0].abbr, abbr: game.teams[0].abbr, fill: fillHome, cents: homePrice, label: `${game.teams[0].abbr} · ${homePrice}¢`, pickLabel: `${game.teams[0].abbr} · ${vs}`, slotPrefix: `${game.teams[0].abbr} · ` },
    ...(threeWay
      ? [{ key: "draw", abbr: "DRAW", fill: drawTint, cents: drawPrice ?? 0, label: `DRAW ${drawPrice}¢`, pickLabel: `Draw · ${vs}`, slotPrefix: "DRAW " }]
      : []),
    { key: game.teams[1].abbr, abbr: game.teams[1].abbr, fill: fillAway, cents: awayPrice, label: `${game.teams[1].abbr} · ${awayPrice}¢`, pickLabel: `${game.teams[1].abbr} · ${vs}`, slotPrefix: `${game.teams[1].abbr} · ` },
  ];
  return (
    <View style={{ borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 14, paddingBottom: showFooter ? 16 : 20 }}>
      {/* Versus format (mirrors the SINGLE-mode league cards): centered title,
          helmets pinned to the edges, fill-width centered scores, stacked
          LIVE clock in the middle, split probability bar underneath. */}
      <Pressable onPress={onOpen} disabled={!onOpen}>
      <Text {...oswald} numberOfLines={1} style={{ fontFamily: displayFont, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: "center" }}>
        {game.teams[0].name} vs. {game.teams[1].name}
      </Text>

      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
          <ComboTeamMark source={comboTeamMark(game.teams[0])} size={40} />
          <Text {...oswald} numberOfLines={1} style={{ flex: 1, fontFamily: displayFont, fontSize: 32, lineHeight: 40, color: "#fff", textAlign: "center" }}>
            {game.teams[0].score}
          </Text>
        </View>
        <View style={{ flexShrink: 0, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LiveDot color={colors.green} />
            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, color: colors.green }}>LIVE</Text>
          </View>
          <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: "center" }} numberOfLines={1}>
            {game.clock}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
          <Text {...oswald} numberOfLines={1} style={{ flex: 1, fontFamily: displayFont, fontSize: 32, lineHeight: 40, color: "#fff", textAlign: "center" }}>
            {game.teams[1].score}
          </Text>
          <ComboTeamMark source={comboTeamMark(game.teams[1])} size={40} />
        </View>
      </View>

      <View style={{ marginTop: 16, flexDirection: "row", gap: 4, width: "100%", height: 2 }}>
        <View style={{ flexBasis: `${(homePrice / Math.max(barTotal, 1)) * 100}%`, flexGrow: 0, flexShrink: 1, height: 2, borderRadius: 999, backgroundColor: fillHome }} />
        {threeWay ? (
          <View style={{ flexBasis: `${((drawPrice ?? 0) / Math.max(barTotal, 1)) * 100}%`, flexGrow: 0, flexShrink: 1, height: 2, borderRadius: 999, backgroundColor: colors.slate }} />
        ) : null}
        <View style={{ flexBasis: `${(awayPrice / Math.max(barTotal, 1)) * 100}%`, flexGrow: 0, flexShrink: 1, height: 2, borderRadius: 999, backgroundColor: fillAway }} />
      </View>
      </Pressable>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        {outcomes.map((o) => {
          const id = `${game.id}:${periodKey}${o.key}`;
          const on = selected(id);
          const isDraw = o.key === "draw";
          const otherTeam = isDraw ? undefined : game.teams[0].abbr === o.key ? game.teams[1] : game.teams[0];
          const otherCents = otherTeam === game.teams[0] ? homePrice : awayPrice;
          return (
            <ComboSelectedButton
              key={o.key}
              selected={on}
              accessibilityLabel={`${o.abbr} combo pick`}
              onPress={() =>
                onToggle({
                  id,
                  category: category.label,
                  categoryIcon: category.icon,
                  categoryEmoji: category.emoji,
                  label: o.pickLabel,
                  color: o.fill,
                  cents: o.cents,
                  side: "yes",
                  avatar: isDraw ? undefined : comboTeamMark(game.teams[0].abbr === o.key ? game.teams[0] : game.teams[1]),
                  kind: "ml",
                  sport: game.sport,
                  period,
                  alt: otherTeam
                    ? {
                        id: `${game.id}:${periodKey}${otherTeam.abbr}`,
                        label: `${otherTeam.abbr} · ${vs}`,
                        color: marketAccentColor(otherTeam.color),
                        cents: otherCents,
                        avatar: comboTeamMark(otherTeam),
                      }
                    : undefined,
                })
              }
              label={o.label}
              slotPrefix={o.slotPrefix}
              slotSuffix="¢"
              slotValue={o.cents}
              radius={METAMASK_BUTTON_RADIUS}
              height={48}
              flex={1}
              fontSize={threeWay ? 13 : 16}
              fontFamily={geist.semibold}
              lineHeight={21}
              unselectedColor={o.fill}
              unselectedChrome={unselectedChrome}
            />
          );
        })}
      </View>

      <CardBuildComboButton showBuildCombo radius={METAMASK_BUTTON_RADIUS} />

      {showFooter ? (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ height: 20, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)", justifyContent: "center", paddingHorizontal: 6 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>{game.league}</Text>
          </View>
          <VolumeText style={{ fontSize: 12, lineHeight: 16 }}>{game.vol}</VolumeText>
        </View>
        <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
          +{game.more} more <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
        </Text>
      </View>
      ) : null}
    </View>
  );
}
