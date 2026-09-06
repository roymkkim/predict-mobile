import { Image, Pressable, Text, View } from "react-native";
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Tag,
  TagSeverity,
} from "@metamask/design-system-react-native";

import { colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { ComboMark } from "@/components/sim/ComboMark";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { TourAnchor } from "@/components/sim/TourAnchor";
import { TradeTicket } from "@/components/sim/TradeTicket";
import { geist } from "@/lib/sim/geistFonts";
import { profileFor } from "@/lib/sim/socialProfiles";
import { useTradeCardLayout } from "@/lib/sim/tradeCardLayoutStore";

export const SOCIAL_DEMO_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
export const SOCIAL_DEMO_HANDLE = "you";

export type ShareableTrade = {
  id?: string;
  market?: string;
  title?: string;
  cost: number;
  toWin: number;
  logo?: string;
  flag?: string;
  combo?: boolean;
  caption?: string;
  gifUrl?: string;
  author?: string;
  timeLabel?: string;
  oddsCents?: number;
};

function marketHandle(market?: string, title?: string) {
  const hay = `${market ?? ""} ${title ?? ""}`;
  if (/bitcoin|\bbtc\b/i.test(hay)) return "BTC";
  if (/ethereum|\beth\b/i.test(hay)) return "ETH";
  if (/solana|\bsol\b/i.test(hay)) return "SOL";
  const fromTitle = (title ?? "").split(" \u00b7 ")[0].trim();
  if (fromTitle && !/^yes|no|up|down|draw$/i.test(fromTitle)) return fromTitle;
  const fromMarket = (market ?? "").split(" ")[0]?.trim();
  return fromMarket || fromTitle || "Trade";
}

function outcomeLabel(title?: string) {
  const t = (title ?? "").split(" \u00b7 ")[0].trim();
  return t || "Your pick";
}

function CopyTradeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Copy trade"
      style={{
        height: 44,
        borderRadius: 12,
        backgroundColor: ON_SURFACE_BUTTON_BG,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Icon name={IconName.Refresh} size={IconSize.Md} color={IconColor.IconDefault} />
      <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>Copy trade</Text>
    </Pressable>
  );
}

export function ShareableTradeCard({
  trade,
  showAuthor = true,
  onCopyTrade,
  tourHighlight = false,
}: {
  trade: ShareableTrade;
  showAuthor?: boolean;
  onCopyTrade?: () => void;
  tourHighlight?: boolean;
}) {
  const outcome = outcomeLabel(trade.title);
  const handle = marketHandle(trade.market, trade.title);
  const layout = useTradeCardLayout();
  const author = trade.author ?? SOCIAL_DEMO_HANDLE;
  const feedWr = profileFor(author).feedWr;
  const cost = trade.cost || 0;
  const toWin = trade.toWin || 0;
  const pct = cost > 0 ? (toWin / cost) * 100 : 0;
  const sub = trade.market && trade.market !== outcome ? trade.market : `${cost.toFixed(2)} to win ${toWin.toFixed(2)}`;

  return (
    <View style={{ gap: 10 }}>
      {showAuthor ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 2 }}>
          <SocialAvatar seed={author} size="md" tappable tourAnchor={tourHighlight} />
          <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary }}>
              {author}
            </Text>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.surface2 }}>
              <Text style={{ fontFamily: geist.medium, fontSize: 11, color: colors.textMuted }}>{feedWr}% WR</Text>
            </View>
            <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted }}>· {trade.timeLabel ?? "just now"}</Text>
          </View>
          <Icon name={IconName.MoreHorizontal} size={IconSize.Md} color={IconColor.IconAlternative} />
        </View>
      ) : null}

      {showAuthor && trade.caption ? (
        <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textPrimary, paddingHorizontal: 2 }}>
          {trade.caption}
        </Text>
      ) : null}

      {trade.gifUrl ? (
        <Image
          source={{ uri: trade.gifUrl }}
          style={{ width: "100%", height: 180, borderRadius: 12, backgroundColor: colors.surface2 }}
          resizeMode="cover"
        />
      ) : null}

      {layout === "ticket" ? (
        <TradeTicket
          market={trade.market}
          outcome={outcome}
          logo={trade.logo}
          flag={trade.flag}
          combo={trade.combo}
          cost={cost}
          toWin={toWin}
        />
      ) : (
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {trade.combo ? (
            <ComboMark size={40} gradient padded={false} />
          ) : (
            <PositionAvatar market={trade.market} title={trade.title} logo={trade.logo} flag={trade.flag} size={36} />
          )}
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>
                {handle}
              </Text>
              <Tag severity={TagSeverity.Success}>{outcome}</Tag>
            </View>
            {showAuthor ? (
              <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted }}>
                {sub}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>
              ${cost.toFixed(2)}
            </Text>
            <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.green, marginTop: 2 }}>
              +{pct.toFixed(2)}%
            </Text>
          </View>
        </View>
        {!showAuthor && trade.caption ? (
          <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>
            {trade.caption}
          </Text>
        ) : null}
        {onCopyTrade ? (
          tourHighlight ? (
            <TourAnchor id="tour-copy-trade">
              <CopyTradeButton onPress={onCopyTrade} />
            </TourAnchor>
          ) : (
            <CopyTradeButton onPress={onCopyTrade} />
          )
        ) : null}
      </View>
      )}
      {layout === "ticket" && onCopyTrade ? (
        tourHighlight ? (
          <TourAnchor id="tour-copy-trade">
            <CopyTradeButton onPress={onCopyTrade} />
          </TourAnchor>
        ) : (
          <CopyTradeButton onPress={onCopyTrade} />
        )
      ) : null}
    </View>
  );
}

export async function shareTradeText(trade: ShareableTrade) {
  const handle = marketHandle(trade.market, trade.title);
  const text = `I just bought ${trade.title ?? "this pick"} on ${handle}.`;
  const payload = { title: "Submitted trade", text };
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(payload);
      return;
    }
  } catch {
    // User cancelled the sheet — fall through to clipboard.
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Clipboard can fail in insecure contexts; sharing is best-effort.
  }
}

export function ShareTradeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel="Share trade">
      <Icon name={IconName.Share} size={IconSize.Lg} color={IconColor.IconDefault} />
    </Pressable>
  );
}
