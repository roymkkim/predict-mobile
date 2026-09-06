import { useLocalSearchParams, useRouter } from "expo-router";

import { SocialComposer } from "@/components/sim/SocialComposer";
import { type ShareableTrade } from "@/components/sim/ShareableTradeCard";
import { hrefWithTab } from "@/components/sim/MarketPageTabs";
import { inferDetailHref } from "@/lib/sim/marketRoutes";

function isDetailHref(href: string): boolean {
  return /\/(match-detail|prediction-detail|game-detail|tennis-detail|btc-updown|btc-150k)(\?|$)/.test(href);
}

function detailHrefFor(returnTo: string | undefined, market: string | undefined): string {
  if (returnTo && isDetailHref(returnTo)) return returnTo;
  const inferred = inferDetailHref(market);
  if (inferred) return inferred;
  if (market) return `/prediction-detail?t=${encodeURIComponent(market)}`;
  return "/";
}

export default function SharePostScreen() {
  const router = useRouter();
  const { market, title, cost, toWin, logo, flag, combo, returnTo } = useLocalSearchParams<{
    market?: string;
    title?: string;
    cost?: string;
    toWin?: string;
    logo?: string;
    flag?: string;
    combo?: string;
    returnTo?: string;
  }>();

  const trade: ShareableTrade = {
    market: typeof market === "string" ? market : undefined,
    title: typeof title === "string" ? title : undefined,
    cost: parseFloat(cost ?? "") || 0,
    toWin: parseFloat(toWin ?? "") || 0,
    logo: typeof logo === "string" && logo ? logo : undefined,
    flag: typeof flag === "string" && flag ? flag : undefined,
    combo: combo === "1",
  };

  return (
    <SocialComposer
      trade={trade}
      onClose={() => router.back()}
      onPosted={(next) => {
        const detail = detailHrefFor(typeof returnTo === "string" ? returnTo : undefined, next.market ?? trade.market);
        let href = hrefWithTab(detail, "social");
        if (next.id) href += `${href.includes("?") ? "&" : "?"}post=${encodeURIComponent(next.id)}`;
        router.replace(href as never);
      }}
    />
  );
}
