import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  UXR_SPORTS,
  UxrCardProviders,
  UxrGameGroups,
  UxrPageScroll,
  UxrPropsList,
  UxrRow,
  UxrTabs,
  leagueGames,
  leagueProps,
  sportBySlug,
} from "@/components/sim/UxrBrowse";
import { TOPICS, MatchCard, BinaryCard } from "@/lib/sim/topicMarkets";
import { CRYPTO_MARKETS, POLITICS_MARKETS, TRENDING_SUBS, CRYPTO_SUBS, POLITICS_SUBS } from "@/lib/sim/hubMarkets";
import { matchDetailHref, PREDICTION_DETAIL_HREF } from "@/lib/sim/marketRoutes";
import { UXR_ICONS, UXR_MATERIAL_ICONS, UXR_MCI_ICONS } from "@/lib/sim/uxrIcons";
import { useCategoryTileStyle } from "@/lib/sim/categoryTileStore";
import { sheetEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { colors } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";

// ── Chips mode ("Robinhood/Spotify toggle chips") ────────────────────────────
// One combined page for every category. The page title ("NFL ⌄" / "Trending ⌄")
// opens a full-screen categories picker; selecting a category transitions this
// same page in place. Subnavigation renders as toggle chips under the title
// (Games/Props for leagues & sports, topic chips for Trending/Crypto/Politics).
// Route: /uxr-chips?sel=<key> (defaults to trending).

type SelKind =
  | { kind: "hub"; hub: "trending" | "crypto" | "politics" }
  | { kind: "league"; league: string }
  | { kind: "sport"; sport: string };

type Sel = { key: string; label: string } & SelKind;

const SELECTIONS: Sel[] = [
  { key: "trending", label: "Trending", kind: "hub", hub: "trending" },
  { key: "crypto", label: "Crypto", kind: "hub", hub: "crypto" },
  { key: "politics", label: "Politics", kind: "hub", hub: "politics" },
  { key: "nfl", label: "NFL", kind: "league", league: "NFL" },
  { key: "college-football", label: "College football", kind: "league", league: "NCAA Football" },
  ...UXR_SPORTS.filter((s) => s.slug !== "football").map(
    (s): Sel => ({ key: s.slug, label: s.label, kind: "sport", sport: s.slug }),
  ),
  { key: "esports", label: "E-sports", kind: "sport", sport: "esports" },
];

const selByKey = (key: string | undefined): Sel =>
  SELECTIONS.find((s) => s.key === key) ?? SELECTIONS[0];

// Full-screen categories picker — in-app-browser-style modal presentation
// (slides up over the page; spring enter, tween exit per the motion spec).
function CategoriesPicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = screenTopInset(insets.top);
  const { height: winH } = useWindowDimensions();
  const material = useCategoryTileStyle() === "material";
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Sequence token guards the close callback: a reopen during the exit tween
  // bumps the token, so the stale close no longer unmounts the modal.
  const seq = useRef(0);
  useEffect(() => {
    const token = ++seq.current;
    if (visible) {
      setRendered(true);
      Animated.parallel([sheetEnter(progress), backdropIn(fade)]).start();
    } else if (rendered) {
      Animated.parallel([sheetExit(progress), backdropOut(fade)]).start(({ finished }) => {
        if (finished && seq.current === token) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!rendered) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [winH, 0] });

  const pick = (key: string) => {
    onSelect(key);
    onClose();
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", opacity: fade }} />
      <Animated.View style={{ flex: 1, transform: [{ translateY }], backgroundColor: colors.bg, paddingTop: topInset + 8 }}>
        {/* Nav row: back chevron · centered "Categories" title */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44 }}>
          <Pressable onPress={onClose} hitSlop={10} style={{ width: 40 }}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: "center", fontFamily: geist.semibold, fontSize: 17, color: colors.textPrimary }}>
            Categories
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <UxrPageScroll>
          <View>
            <UxrRow label="Trending" emoji="🔥" materialIcon={material ? "local-fire-department" : undefined} onPress={() => pick("trending")} />
            <UxrRow label="Crypto" icon={UXR_ICONS.crypto} materialIcon={material ? UXR_MATERIAL_ICONS.crypto : undefined} onPress={() => pick("crypto")} />
            <UxrRow label="Politics" icon={UXR_ICONS.politics} materialIcon={material ? UXR_MATERIAL_ICONS.politics : undefined} onPress={() => pick("politics")} />
          </View>
          <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.cardBorder }} />
          <View>
            <Text style={{ fontFamily: geist.semibold, fontSize: 17, color: colors.textPrimary, paddingHorizontal: 16, marginBottom: 4 }}>
              Sports
            </Text>
            {UXR_SPORTS.map((s) => (
              <View key={s.slug}>
                <UxrRow
                  label={s.label}
                  icon={UXR_ICONS[s.slug]}
                  materialIcon={material ? UXR_MATERIAL_ICONS[s.slug] : undefined}
              mciIcon={material ? UXR_MCI_ICONS[s.slug] : undefined}
                  emoji={s.emoji}
                  onPress={() => pick(s.slug === "football" ? "nfl" : s.slug)}
                />
                {/* Football lists its leagues as indented sub-rows (per mock). */}
                {s.slug === "football" && (
                  <View>
                    {[
                      { key: "nfl", label: "NFL" },
                      { key: "college-football", label: "College football" },
                    ].map((l) => (
                      <Pressable key={l.key} onPress={() => pick(l.key)} style={{ paddingLeft: 54, paddingVertical: 11 }}>
                        <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>{l.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <UxrRow label="E-sports" emoji="🎮" materialIcon={material ? UXR_MATERIAL_ICONS.esports : undefined} onPress={() => pick("esports")} />
          </View>
        </UxrPageScroll>
      </Animated.View>
    </Modal>
  );
}

// Topic content (Trending subcats reuse the shared TOPICS data).
function TopicChipsContent({ topicKey }: { topicKey: string }) {
  const router = useRouter();
  const topic = TOPICS[topicKey];
  if (!topic) return null;
  return (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      {topic.kind === "match"
        ? topic.data.map((m, i) => (
            <Pressable key={i} onPress={() => router.push(matchDetailHref(m) as never)}>
              <MatchCard m={m} layout="global" />
            </Pressable>
          ))
        : topic.data.map((b) => (
            <Pressable key={b.title} onPress={() => router.push({ pathname: PREDICTION_DETAIL_HREF, params: { t: b.title, yes: String(parseInt(b.match.teams[0].pct ?? "50", 10) || 50), vol: b.match.vol } } as never)}>
              <BinaryCard item={b} />
            </Pressable>
          ))}
    </View>
  );
}

function HubContent({ hub }: { hub: "trending" | "crypto" | "politics" }) {
  const subs = hub === "trending" ? TRENDING_SUBS : hub === "crypto" ? CRYPTO_SUBS : POLITICS_SUBS;
  const [sub, setSub] = useState(subs[0].key);
  // Reset the chip selection when the category changes.
  useEffect(() => setSub(subs[0].key), [hub]); // eslint-disable-line react-hooks/exhaustive-deps
  const content = () => {
    if (hub === "trending") return <TopicChipsContent topicKey={sub} />;
    if (hub === "crypto") {
      const list =
        sub === "bitcoin" ? CRYPTO_MARKETS.slice(0, 1) : sub === "ethereum" ? CRYPTO_MARKETS.slice(1, 2) : CRYPTO_MARKETS;
      return <UxrPropsList props={list} />;
    }
    const list = sub === "geopolitics" ? TOPICS.iran : undefined;
    return list && list.kind === "binary" ? <UxrPropsList props={list.data} /> : <UxrPropsList props={POLITICS_MARKETS} />;
  };
  return (
    <>
      <UxrTabs tabs={subs.map((s) => ({ key: s.key, label: s.label }))} active={sub} onChange={setSub} />
      <UxrCardProviders>{content()}</UxrCardProviders>
    </>
  );
}

function GamesPropsContent({ sel }: { sel: Sel }) {
  const [tab, setTab] = useState<"games" | "props">("games");
  useEffect(() => setTab("games"), [sel.key]);
  const sport = sel.kind === "sport" ? sportBySlug(sel.sport) : undefined;
  const games = sel.kind === "league" ? leagueGames(sel.league) : sport?.games ?? [];
  const props = sel.kind === "league" ? leagueProps(sel.league) : sport?.props ?? [];
  return (
    <>
      <UxrTabs
        tabs={[
          { key: "games", label: "Games" },
          { key: "props", label: "Props" },
        ]}
        active={tab}
        onChange={setTab}
      />
      <UxrCardProviders>{tab === "games" ? <UxrGameGroups groups={games} /> : <UxrPropsList props={props} />}</UxrCardProviders>
    </>
  );
}

export default function UxrChipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = screenTopInset(insets.top);
  const { sel: selParam, pick } = useLocalSearchParams<{ sel?: string; pick?: string }>();
  const [selKey, setSelKey] = useState(() => selByKey(typeof selParam === "string" ? selParam : undefined).key);
  const [pickerOpen, setPickerOpen] = useState(pick === "1");
  // Re-sync when the params change on an already-mounted screen (same-route
  // pushes reuse the instance on web) so URL stays the source of truth.
  useEffect(() => {
    if (typeof selParam === "string") setSelKey(selByKey(selParam).key);
  }, [selParam]);
  useEffect(() => {
    if (pick === "1") setPickerOpen(true);
  }, [pick]);
  const sel = selByKey(selKey);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: topInset + 8 }}>
      {/* Nav row: back chevron only (title sits below, left-aligned per mock). */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40 }}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>
      <UxrPageScroll>
        {/* Title toggles the categories picker: "NFL ⌄" */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontFamily: geist.semibold, fontSize: 24, lineHeight: 32, color: colors.textPrimary }}>{sel.label}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textPrimary} />
        </Pressable>
        {sel.kind === "hub" ? <HubContent hub={sel.hub} /> : <GamesPropsContent sel={sel} />}
      </UxrPageScroll>
      <CategoriesPicker visible={pickerOpen} onSelect={setSelKey} onClose={() => setPickerOpen(false)} />
    </View>
  );
}
