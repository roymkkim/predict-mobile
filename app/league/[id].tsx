import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/lib/sim/colors";

export default function LeagueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const title = typeof id === "string" ? decodeURIComponent(id) : "League";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={title} />
    </View>
  );
}
