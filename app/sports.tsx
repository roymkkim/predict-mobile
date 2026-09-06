import React from "react";
import { useLocalSearchParams } from "expo-router";

import SportsV1 from "@/components/SportsV1";
import SportsV2 from "@/components/SportsV2";

// ─────────────────────────────────────────────────────────────────────────────
//  CHANGE THIS to switch which Sports page version is active.
//    "v1" → original filter-bar feed (Soccer/Basket tabs + filter chips)
//    "v2" → icon-tile categories + Live games / Starting soon / World Cup
// ─────────────────────────────────────────────────────────────────────────────
const SPORTS_VERSION: "v1" | "v2" = "v2";

export default function SportsScreen() {
  const params = useLocalSearchParams<{ filter?: string; tab?: string; v?: string }>();
  const version = (params.v === "v1" || params.v === "v2") ? params.v : SPORTS_VERSION;

  if (version === "v1") {
    return (
      <SportsV1
        initialFilter={typeof params.filter === "string" ? params.filter : undefined}
        initialTab={typeof params.tab === "string" ? params.tab : undefined}
      />
    );
  }
  return <SportsV2 />;
}
