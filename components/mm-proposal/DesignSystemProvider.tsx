import { Theme, ThemeProvider } from "@metamask/design-system-twrnc-preset";
import type { ReactNode } from "react";

import { useThemeMode } from "@/lib/sim/dsModeStore";

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const themeMode = useThemeMode();
  return (
    <ThemeProvider theme={themeMode === "light" ? Theme.Light : Theme.Dark}>
      {children}
    </ThemeProvider>
  );
}
