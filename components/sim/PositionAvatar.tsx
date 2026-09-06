import { useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";

import { findPredictionMarket, outcomeAvatarForPick } from "@/lib/sim/predictionRegistry";
import type { OutcomeAvatar } from "@/lib/sim/types";

import { OutcomeAvatarView } from "./OutcomeRows";

// Shared mark for placed-position surfaces (trade-submitted, Positions,
// wallet home, cash-out, bet slip). Prefer an outcome/market asset from the
// prediction registry so BTC/ETH never fall back to a football helmet.
const FALLBACKS: { re: RegExp; source: ImageSourcePropType; contain?: boolean }[] = [
  { re: /bitcoin|btc/i, source: require("@/assets/figmaAssets/btc-logo-orange.png"), contain: true },
  { re: /ethereum|\beth\b/i, source: require("@/assets/figmaAssets/icon-3d-crypto.png"), contain: true },
  { re: /solana|\bsol\b/i, source: require("@/assets/figmaAssets/icon-solana-logo.png"), contain: true },
  { re: /fed|rates|shutdown|government|election|senate|congress|president|press secretary|trump/i, source: require("@/assets/figmaAssets/fed-building.png") },
  { re: /crypto|coin|token|etf/i, source: require("@/assets/figmaAssets/icon-3d-crypto.png"), contain: true },
];

function flagUri(flag: string) {
  return flag.startsWith("http") ? flag : `https://flagcdn.com/w80/${flag}.png`;
}

function registryAvatar(market?: string, title?: string): OutcomeAvatar | undefined {
  const outcome = outcomeAvatarForPick(market, title);
  if (outcome?.type === "image") return outcome;
  const rec = findPredictionMarket(market) ?? findPredictionMarket(title);
  if (rec?.avatar) {
    return { type: "image", source: rec.avatar, contain: rec.avatarContain ?? true, bg: rec.avatarBg };
  }
  return undefined;
}

export function PositionAvatar({
  market,
  title,
  logo,
  flag,
  size = 40,
}: {
  market?: string;
  title?: string;
  logo?: string;
  flag?: string;
  size?: number;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const radius = Math.round(size * 0.22);
  const fromRegistry = registryAvatar(market, title);

  if (logo && !logoFailed) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={{ uri: logo }}
          resizeMode="contain"
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }
  if (fromRegistry) {
    return <OutcomeAvatarView avatar={fromRegistry} size={size} radius={radius} />;
  }
  if (flag) {
    return (
      <Image
        source={{ uri: flagUri(flag) }}
        resizeMode="cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  const hay = `${market ?? ""} ${title ?? ""}`;
  const fallback = FALLBACKS.find((f) => f.re.test(hay));
  if (fallback) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={fallback.source}
          resizeMode={fallback.contain ? "contain" : "cover"}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      </View>
    );
  }
  return <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: "rgba(255,255,255,0.08)" }} />;
}
