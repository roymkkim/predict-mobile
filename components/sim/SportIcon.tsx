import { accessibleColor } from "@/lib/sim/colors";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";

export function SportIcon({
  sport,
  color,
  size = 16,
}: {
  sport: string;
  color?: string;
  size?: number;
}) {
  if (!outlinedSportId(sport)) return null;
  return (
    <MaterialOutlinedSportIcon
      name={sport}
      size={size}
      color={color ? accessibleColor(color) : "#ffffff"}
    />
  );
}
