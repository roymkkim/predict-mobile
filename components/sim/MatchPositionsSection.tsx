import React from "react";
import { Text, View } from "react-native";

import { colors, uxrPaletteColor } from "@/lib/sim/colors";
import { mockCurrent, usePlacedPositions, positionMeta, setAutoSellTarget, type PlacedPosition } from "@/lib/sim/positionsStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { openCashOut } from "@/lib/sim/cashOutStore";
import { openAutoSell } from "@/lib/sim/autoSellStore";
import { PositionCard } from "@/components/sim/CurrentPositionsCard";
import { ComboPositionCard } from "@/components/sim/ComboPositionCard";
import { ComboSheet, type ComboPick } from "@/components/sim/ComboSheet";
import { replacePickInList } from "@/lib/sim/comboPicksStore";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { geist } from "@/lib/sim/geistFonts";

// Shared "Positions" section body for the sports detail pages (game-detail's
// GamePositions generalized): placed positions that reference this matchup —
// matched by team/player name or abbr — with Buy more / Cash out actions and
// a "No positions" empty state. `avatar` lets a page keep its own crest
// treatment (e.g. helmets on game-detail).
const GENERIC_OUTCOME = /^(up|down|yes|no)$/i;

export function filterMarketPositions(placed: PlacedPosition[], names: string[], marketTitle?: string): PlacedPosition[] {
  const specific = names.filter((n) => n.length >= 3 && !GENERIC_OUTCOME.test(n));
  return placed.filter((p) => {
    if (p.kind === "combo") {
      return p.legs.some(
        (l) => names.some((n) => l.label.includes(n)) || (!!marketTitle && l.label.includes(marketTitle)),
      );
    }
    if (
      marketTitle &&
      p.market &&
      (p.market === marketTitle || p.market.includes(marketTitle) || marketTitle.includes(p.market))
    ) {
      return true;
    }
    return specific.some((n) => p.title.includes(n) || (p.market ?? "").includes(n));
  });
}

export function MatchPositionsSection({
  names,
  returnTo,
  avatar,
  hideHeading,
  showEmpty,
  marketTitle,
}: {
  names: string[];
  returnTo: string;
  avatar?: (color: string) => React.ReactNode;
  hideHeading?: boolean;
  showEmpty?: boolean;
  marketTitle?: string;
}) {
  const placed = usePlacedPositions();
  // "Buy more" on a combo re-opens the combo ticket pre-loaded with its legs.
  const [slipPicks, setSlipPicks] = React.useState<ComboPick[]>([]);
  const mine = filterMarketPositions(placed, names, marketTitle);
  if (mine.length === 0) {
    if (!showEmpty) return null;
    return (
      <View style={{ padding: 32, alignItems: "center" }}>
        {!hideHeading ? <DetailSectionHeading>Positions</DetailSectionHeading> : null}
        <Text style={{ color: colors.textMuted, fontFamily: geist.regular, fontSize: 14 }}>No positions yet</Text>
      </View>
    );
  }
  return (
    <>
    {!hideHeading ? <DetailSectionHeading>Positions</DetailSectionHeading> : null}
    <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
      {mine.map((p) => {
        if (p.kind === "combo")
          return (
            <ComboPositionCard
              key={p.id}
              position={p}
              onBuyMore={() =>
                setSlipPicks(
                  p.legs.map((leg, i) => ({
                    id: `${p.id}:${i}`,
                    category: leg.category,
                    categoryEmoji: leg.categoryEmoji,
                    label: leg.label,
                    color: leg.color,
                    cents: leg.cents,
                  })),
                )
              }
              onCashOut={() => {
                const { current } = mockCurrent(p);
                openCashOut({
                  tint: p.legs[0]?.color ?? colors.green,
                  title: `${p.legs.length} market combination`,
                  sub: `$${p.cost.toFixed(2)} used`,
                  current,
                  cost: p.cost,
                  cents: p.legs[0]?.cents ?? 50,
                  combo: true,
                });
              }}
            />
          );
        const { current, changePct } = mockCurrent(p);
        const autoSellEnabled = p.orderType === "limit";
        // On a match's own detail page the "· Panthers vs Cardinals" suffix is
        // redundant — keep just the pick + price.
        const pick = p.title.split(" \u00b7 ")[0];
        return (
          <PositionCard
            key={p.id}
            avatar={avatar?.(p.color) ?? <PositionAvatar market={p.market} title={p.title} size={40} />}
            title={p.market ?? p.title}
            meta={positionMeta(pick, p.cents)}
            value={`$${current.toFixed(2)}`}
            changeText={`+${changePct.toFixed(2)}%`}
            positive
            onBuyMore={() => openBetSlip({ title: p.title, market: p.market, oddsCents: p.cents, color: p.color, side: "yes", returnTo })}
            onCashOut={() =>
              openCashOut({
                tint: uxrPaletteColor(p.color),
                title: p.market ?? p.title,
                sub: positionMeta(pick, p.cents),
                current,
                cost: p.cost,
                cents: p.cents,
              })
            }
            onAutoSell={
              autoSellEnabled
                ? () =>
                    openAutoSell({
                      tint: uxrPaletteColor(p.color),
                      cost: current,
                      toWin: p.cost + p.toWin,
                      onSet: (target) => setAutoSellTarget(p.id, target),
                    })
                : undefined
            }
            autoSellTarget={autoSellEnabled ? p.autoSellAt : undefined}
          />
        );
      })}
      {slipPicks.length > 0 && (
        <ComboSheet
          key={slipPicks.map((x) => x.id).join(",")}
          picks={slipPicks}
          onRemove={(id) => setSlipPicks((prev) => prev.filter((x) => x.id !== id))}
          onReplace={(id, next) => setSlipPicks((prev) => replacePickInList(prev, id, next))}
          onClear={() => setSlipPicks([])}
          onClose={() => setSlipPicks([])}
          initialScreen={1}
          returnTo={returnTo}
        />
      )}
    </View>
    </>
  );
}

// Shared section heading + Games/Props pills for the stacked detail layout.
export function DetailSectionHeading({ children, marginTop = 26 }: { children: string; marginTop?: number }) {
  return (
    <Text style={{ color: colors.textPrimary, fontFamily: geist.semibold, fontSize: 20, lineHeight: 26, paddingHorizontal: 16, marginTop }}>
      {children}
    </Text>
  );
}
