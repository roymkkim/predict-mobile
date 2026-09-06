import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontWeight, Text, TextColor, TextVariant } from "@metamask/design-system-react-native";

import { ComboGradientAdded, ComboSelectedButton } from "@/components/sim/ComboGradient";
import { ComboLegAvatar } from "@/components/sim/ComboLegAvatar";
import { ComboLegSwapButton } from "@/components/sim/ComboLegSwapButton";
import { SnapHScroll } from "@/components/sim/SnapHScroll";
import type { ComboPick } from "@/components/sim/ComboSheet";
import { comboPaysCopy } from "@/lib/sim/comboPays";
import { buildEventComboPreviews, EVENT_PICKS_GUTTER, eventPicksCardWidth } from "@/lib/sim/comboEventPicks";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { MetaTag, TradedMeta } from "@/components/sim/MetaHeader";
import { colors } from "@/lib/sim/colors";
import {
  COMBO_PREVIEW_MIN_LEGS,
  comboPreviewPicks,
  type ComboPreview,
} from "@/lib/sim/comboData";
import { comboPreviewByLabel, comboPreviewsForVenue, useKalshiVenue } from "@/lib/sim/kalshiMarkets";
import { comboLegCopy } from "@/lib/sim/comboLegCopy";
import { enterComboFlow } from "@/lib/sim/comboFlowStore";
import { flipComboPick } from "@/lib/sim/comboPickEdit";
import {
  addComboTemplatePicks,
  toggleComboTemplatePicks,
  useComboPicks,
} from "@/lib/sim/comboPicksStore";
import { setComboCartDropPointer } from "@/lib/sim/comboCartDropStore";
import { closeComboCartSlip, getComboAffordance } from "@/lib/sim/comboAffordanceStore";
import {
  consumeComboTemplateAdd,
  pendingComboTemplateAddIs,
  queueComboTemplateAdd,
  CAROUSEL_ADD_DELAY_MS,
} from "@/lib/sim/comboTemplateLaunch";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
export const TEMPLATES_HREF = "/combination?tab=templates";

/** Space from tag/vol header → pick list → footer (carousel + Picks). */
const COMBO_CARD_SECTION_GAP = 12;
/** Picks feed only: last pick row → Add (carousel keeps 12). Put on Add, not last row. */
const PICKS_LAST_ROW_TO_ADD_GAP = COMBO_CARD_SECTION_GAP + 4;
/** Home Combos carousel: gap between pick rows (last row → pays uses COMBO_CARD_SECTION_GAP). */
const COMBO_LEG_ROW_GAP = 8;
/** Combos page Picks tab: gap between pick rows (last row has no bottom margin). */
const PICKS_LEG_ROW_GAP = 8;
/** Home Combos carousel only — MMA / Pro Football preview tiles. */
const HOME_COMBO_CARD = 300;
/** MMDS Button Sm: h-8, rounded-lg, px-3, Body Sm. */
const HOME_COMBO_PAYS_H = 40;
const HOME_COMBO_PAYS_RADIUS = 12;
/** Kill web <p> margin + Android includeFontPadding so Body Md doesn't sit high vs avatar. */
const PICK_COPY_RESET = {
  marginTop: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  includeFontPadding: false as const,
};

/** Gray tail: “vs. Opponent” — drops the name before vs. */
function vsOpponentCopy(outcome: string, market: string): string {
  const m = market.trim();
  if (!m) return "";
  const parts = m.split(/\s+vs\.?\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const name = outcome.replace(/\s+to win(?:\s+by\s+\S+)?$/i, "").trim();
    const lower = name.toLowerCase();
    const opponent =
      lower && parts[0].toLowerCase() === lower
        ? parts[1]
        : lower && parts[1].toLowerCase() === lower
          ? parts[0]
          : parts[1];
    return `vs. ${opponent}`;
  }
  return m;
}

function ComboSecondaryText({
  children,
  style,
  variant = TextVariant.BodySm,
}: {
  children: React.ReactNode;
  style?: object;
  variant?: TextVariant;
}) {
  return (
    <Text
      variant={variant}
      fontWeight={FontWeight.Regular}
      color={TextColor.TextAlternative}
      numberOfLines={1}
      style={{ ...PICK_COPY_RESET, ...style }}
    >
      {children}
    </Text>
  );
}

function MoreChevron() {
  return (
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
      <Path d="M5.92486 14.4038L4.74153 13.2205L10.2249 7.73713L4.74153 2.2538L5.92486 1.07047L12.5915 7.73713L5.92486 14.4038Z" fill={colors.textMuted} />
    </Svg>
  );
}

export function comboTemplateHref(label: string): string {
  return `${TEMPLATES_HREF}&template=${encodeURIComponent(label)}`;
}

function addTemplateToCart(legs: ComboPick[], origin?: View | null) {
  const finish = () => {
    if (getComboAffordance() === "cart") closeComboCartSlip();
    addComboTemplatePicks(legs);
    enterComboFlow();
  };
  if (getComboAffordance() === "cart" && origin && typeof origin.measureInWindow === "function") {
    origin.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) setComboCartDropPointer({ x: x + w / 2, y: y + h / 2 });
      finish();
    });
    return;
  }
  finish();
}

export function toggleComboTemplate(preview: ComboPreview) {
  toggleComboTemplatePicks(comboPreviewPicks(preview));
  enterComboFlow();
  if (getComboAffordance() === "cart") closeComboCartSlip();
}

/** Home carousel: add every template leg and open combo mode. */
export function applyComboTemplate(preview: ComboPreview) {
  addComboTemplatePicks(comboPreviewPicks(preview));
  enterComboFlow();
}

export function applyComboTemplateFromLabel(label: string): boolean {
  const preview = comboPreviewByLabel(label);
  if (!preview) return false;
  applyComboTemplate(preview);
  return true;
}

/** Open Combos Picks — do not add yet, and do not pass `template` (that
 *  scrollIntoView shifts the web phone frame during the push). */
export function openComboTemplatePage(
  _preview: ComboPreview,
  navigate: (href: string) => void,
) {
  enterComboFlow();
  navigate(TEMPLATES_HREF);
}

/** Carousel CTA: open Picks first, then add after the slide settles. */
export function openComboTemplateFromCarousel(
  preview: ComboPreview,
  navigate: (href: string) => void,
) {
  queueComboTemplateAdd(preview.label);
  openComboTemplatePage(preview, navigate);
}

/** @deprecated carousel CTA now lands on Picks instead of opening the slip. */
export function openComboTemplateSlip(
  preview: ComboPreview,
  _origin: { windowWidth: number; windowHeight: number; safeBottom: number; safeRight?: number },
  navigate: (href: string) => void,
) {
  openComboTemplateFromCarousel(preview, navigate);
}

function isTemplateSelected(legs: ComboPick[], picks: ComboPick[]): boolean {
  if (legs.length === 0) return false;
  return legs.every((leg) => picks.some((p) => p.id === leg.id));
}

function resolveTemplateLeg(base: ComboPick, edits: Record<string, ComboPick>): ComboPick {
  return edits[base.id] ?? base;
}

function ComboTemplateCard({
  combo,
  width,
  height,
  showCta = true,
  onPress,
  onUse,
}: {
  combo: ComboPreview;
  width?: number;
  height?: number;
  showCta?: boolean;
  onPress?: () => void;
  onUse?: () => void;
}) {
  const [edits, setEdits] = useState<Record<string, ComboPick>>({});
  const slip = useComboPicks();
  const bases = useMemo(() => comboPreviewPicks(combo), [combo]);
  const resolved = useMemo(() => bases.map((b) => resolveTemplateLeg(b, edits)), [bases, edits]);
  const selected = isTemplateSelected(resolved, slip);
  const ctaRef = useRef<View>(null);

  // Carousel CTA: this Picks card mounts unselected, then adds so the FAB drop can play.
  useEffect(() => {
    if (!showCta || !pendingComboTemplateAddIs(combo.label)) return;
    if (selected) {
      consumeComboTemplateAdd(combo.label);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || !consumeComboTemplateAdd(combo.label)) return;
      addTemplateToCart(resolved, ctaRef.current);
    }, CAROUSEL_ADD_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [combo.label, resolved, selected, showCta]);

  const cycleLeg = (base: ComboPick, displayed: ComboPick) => {
    const next = flipComboPick(displayed);
    if (!next) return;
    setEdits((prev) => ({ ...prev, [base.id]: next }));
  };

  const applyPreview = () => {
    if (selected) {
      toggleComboTemplatePicks(resolved);
      enterComboFlow();
      return;
    }
    addTemplateToCart(resolved, ctaRef.current);
  };

  const visible = showCta ? resolved : resolved.slice(0, COMBO_PREVIEW_MIN_LEGS);
  const moreCount = showCta ? 0 : Math.max(0, resolved.length - COMBO_PREVIEW_MIN_LEGS);
  /** Home rail: hug content. 12px tag → picks, 12px last row → pays, 12px pays → vol footer. */
  const carouselTile = !showCta;

  const legs = (
    <View
      style={
        carouselTile ? { flexGrow: 0, flexShrink: 0 } : undefined
      }
    >
      {visible.map((pick, i) => {
        const base = bases[i];
        const { pick: outcome, sub: market, seed } = comboLegCopy(pick.label, {
          category: combo.label,
          kind: pick.kind,
          id: pick.id,
          sport: pick.sport,
        });
        const last = i === visible.length - 1;
        const rowGap = last ? 0 : carouselTile ? COMBO_LEG_ROW_GAP : PICKS_LEG_ROW_GAP;
        if (showCta) {
          return (
            <View
              key={base?.id ?? pick.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: rowGap,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1, minWidth: 0 }}>
                <ComboLegAvatar
                  source={pick.avatar ?? combo.avatars?.[i]}
                  pick={seed}
                  size={24}
                />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1, minWidth: 0 }}>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Regular}
                    color={TextColor.TextDefault}
                    numberOfLines={1}
                    style={{ flexShrink: 1, ...PICK_COPY_RESET }}
                  >
                    {outcome}
                  </Text>
                  <ComboLegSwapButton onPress={() => cycleLeg(base ?? pick, pick)} />
                </View>
              </View>
              {market ? (
                <ComboSecondaryText variant={TextVariant.BodyMd} style={{ flexShrink: 0, marginLeft: 8 }}>
                  {vsOpponentCopy(outcome, market)}
                </ComboSecondaryText>
              ) : null}
            </View>
          );
        }
        const vsTail = vsOpponentCopy(outcome, market);
        return (
          <View
            key={base?.id ?? pick.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingTop: 0,
              paddingBottom: 0,
              marginTop: 0,
              marginBottom: rowGap,
            }}
          >
            <ComboLegAvatar
              source={pick.avatar ?? combo.avatars?.[i]}
              pick={seed}
              size={24}
            />
            {/* Sibling Body Sm — nested MMDS Text is block on web and wraps to two lines. */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 1,
                minWidth: 0,
                flexWrap: "nowrap",
              }}
            >
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Regular}
                color={TextColor.TextDefault}
                numberOfLines={1}
                style={{ flexShrink: 1, ...PICK_COPY_RESET }}
              >
                {outcome}
                {vsTail ? "\u00A0" : ""}
              </Text>
              {vsTail ? (
                <ComboSecondaryText style={{ flexShrink: 1 }}>{vsTail}</ComboSecondaryText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );

  const inner = (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.muted,
        gap: 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: carouselTile ? 0 : COMBO_CARD_SECTION_GAP,
        }}
      >
        <MetaTag>{combo.label}</MetaTag>
        {showCta ? (
          <ComboSecondaryText variant={TextVariant.BodyXs}>{combo.vol}</ComboSecondaryText>
        ) : null}
      </View>
      {carouselTile ? (
        <View style={{ height: COMBO_CARD_SECTION_GAP, flexGrow: 0, flexShrink: 0 }} />
      ) : null}
      {legs}
      {carouselTile ? (
        <View
          style={{
            marginTop: COMBO_CARD_SECTION_GAP,
            marginBottom: COMBO_CARD_SECTION_GAP,
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <ComboSelectedButton
            selected={selected}
            onPress={() => (onUse ? onUse() : applyPreview())}
            label={selected ? undefined : comboPaysCopy(resolved)}
            height={HOME_COMBO_PAYS_H}
            radius={HOME_COMBO_PAYS_RADIUS}
            paddingHorizontal={12}
            fullWidth
            unselectedChrome="outline"
            accessibilityLabel={selected ? "Remove template" : comboPaysCopy(resolved)}
          >
            {selected ? <ComboGradientAdded /> : undefined}
          </ComboSelectedButton>
        </View>
      ) : null}
      {!showCta ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1, minWidth: 0 }}>
            <TradedMeta vol={combo.vol} size="xs" />
            <ComboSecondaryText variant={TextVariant.BodyXs}>{combo.vol}</ComboSecondaryText>
          </View>
          {moreCount > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 16 }}>
              <ComboSecondaryText variant={TextVariant.BodyXs}>{`+${moreCount} more`}</ComboSecondaryText>
              <MoreChevron />
            </View>
          ) : null}
        </View>
      ) : null}
      {showCta && onUse ? (
        <View ref={ctaRef} collapsable={false} style={{ marginTop: PICKS_LAST_ROW_TO_ADD_GAP }}>
          {selected ? (
            <ComboSelectedButton
              selected
              onPress={applyPreview}
              height={40}
              radius={12}
              fullWidth
              accessibilityLabel="Remove template"
            >
              <ComboGradientAdded />
            </ComboSelectedButton>
          ) : (
            <ComboSelectedButton
              selected={false}
              onPress={applyPreview}
              label={comboPaysCopy(resolved)}
              height={40}
              radius={12}
              fullWidth
              unselectedChrome="outline"
              accessibilityLabel={comboPaysCopy(resolved)}
            />
          )}
        </View>
      ) : null}
    </View>
  );

  const handlePress = onPress ?? (carouselTile ? applyPreview : undefined);
  if (handlePress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${combo.label} combo template`}
        onPress={handlePress}
        style={{ width, height, minWidth: 0 }}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={{ width, height, minWidth: 0 }}>{inner}</View>;
}

/** Home Live-adjacent rail of ready-made combos. */
export function CombinationsSection({ gutter = 16 }: { gutter?: number }) {
  const router = useRouter();
  const previews = comboPreviewsForVenue(useKalshiVenue());
  const go = (href: string) => router.push(href as never);
  const openPage = () => {
    enterComboFlow();
    router.push(TEMPLATES_HREF as never);
  };
  return (
    <View>
      <SectionHeader title="Combos" onPress={openPage} />
      <SnapHScroll gutter={gutter} interval={HOME_COMBO_CARD + 8} gap={8}>
        {previews.map((combo) => (
          <ComboTemplateCard
            key={combo.label}
            combo={combo}
            width={HOME_COMBO_CARD}
            showCta={false}
            onPress={() => openComboTemplateFromCarousel(combo, go)}
            onUse={() => openComboTemplateFromCarousel(combo, go)}
          />
        ))}
      </SnapHScroll>
    </View>
  );
}

function TemplateAnchor({
  label,
  focus,
  children,
}: {
  label: string;
  focus?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!focus || focus !== label) return;
    const node = ref.current as unknown as { scrollIntoView?: (opts: { block: string; behavior: string }) => void } | null;
    if (!node?.scrollIntoView) return;
    const id = requestAnimationFrame(() => {
      node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    });
    const t = setTimeout(() => {
      node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }, 520);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [focus, label]);
  return (
    <View ref={ref} collapsable={false}>
      {children}
    </View>
  );
}

const PICKS_FEED_BLURB = "Choose from prebuilt picks";

function PicksFeedHeader() {
  return <View style={{ paddingTop: 16 }} />;
}

/** Vertical Templates feed for the Combos page. */
export function ComboTemplatesFeed({ embedded = false }: { embedded?: boolean }) {
  const params = useLocalSearchParams<{ template?: string | string[] }>();
  const raw = params.template;
  const focus = Array.isArray(raw) ? raw[0] : raw;
  const cards = comboPreviewsForVenue(useKalshiVenue()).map((combo) => (
    <TemplateAnchor key={combo.label} label={combo.label} focus={focus}>
      <ComboTemplateCard combo={combo} onUse={() => toggleComboTemplate(combo)} />
    </TemplateAnchor>
  ));
  if (embedded) {
    return (
      <View style={{ gap: 12 }}>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {PICKS_FEED_BLURB}
        </Text>
        {cards}
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 220, paddingHorizontal: 16 }}>
      <PicksFeedHeader />
      <View style={{ gap: 12 }}>{cards}</View>
    </ScrollView>
  );
}

/** Horizontal prebuilt combos for this event, above Game lines / Props. */
const EVENT_COMBO_CARD_MIN_H = 248;
const EVENT_PICKS_HEADING_GAP = 16;

export function MatchComboPicksCarousel({
  names,
  sport,
  league,
  logos,
  vol,
}: {
  names: string[];
  sport?: string;
  league?: string;
  logos?: (string | undefined)[];
  vol?: string;
}) {
  const combosOn = useCombinationsVisible();
  const { width: winW } = useWindowDimensions();
  const previews = buildEventComboPreviews({ names, sport, league, logos, vol });
  if (!combosOn || previews.length === 0) return null;
  const cardW = eventPicksCardWidth(winW, previews.length);
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        variant={TextVariant.HeadingSm}
        color={TextColor.TextDefault}
        style={{ paddingHorizontal: EVENT_PICKS_GUTTER, ...PICK_COPY_RESET }}
      >
        Picks
      </Text>
      <SnapHScroll
        gutter={EVENT_PICKS_GUTTER}
        interval={cardW + 8}
        gap={8}
        nestedScrollEnabled
        scrollEnabled={previews.length > 1}
        style={{ flexGrow: 0, marginTop: EVENT_PICKS_HEADING_GAP }}
        contentContainerStyle={{ minHeight: EVENT_COMBO_CARD_MIN_H }}
      >
        {previews.map((combo) => (
          <ComboTemplateCard
            key={combo.label}
            combo={combo}
            width={cardW}
            showCta={false}
          />
        ))}
      </SnapHScroll>
    </View>
  );
}
