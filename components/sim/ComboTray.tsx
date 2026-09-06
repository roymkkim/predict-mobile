import { useRouter } from "expo-router";

import { ComboSheet } from "@/components/sim/ComboSheet";
import { exitComboFlow } from "@/lib/sim/comboFlowStore";
import { clearComboPicks, removeComboPick, replaceComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";

export function ComboTray({
  returnTo,
  docked = true,
  dismissible = false,
}: {
  returnTo?: string;
  docked?: boolean;
  dismissible?: boolean;
}) {
  const enabled = useCombinationsVisible();
  const picks = useComboPicks();
  const router = useRouter();
  if (!enabled) return null;
  return (
    <ComboSheet
      picks={picks}
      onRemove={removeComboPick}
      onReplace={replaceComboPick}
      onClear={clearComboPicks}
      returnTo={returnTo}
      docked={docked}
      onClose={
        dismissible
          ? () => {
              exitComboFlow();
              router.setParams({ combo: "" });
            }
          : undefined
      }
    />
  );
}
