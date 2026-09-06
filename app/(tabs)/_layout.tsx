import { Stack } from "expo-router";
import React from "react";

import colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.light.bg },
        animation: "none",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
