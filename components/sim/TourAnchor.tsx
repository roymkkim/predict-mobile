import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { clearTourTarget, setTourTarget, useSocialTour } from "@/lib/sim/socialTourStore";

export function TourAnchor({
  id,
  children,
  style,
}: {
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<View>(null);
  const { active } = useSocialTour();

  const report = useCallback(() => {
    if (!active) return;
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setTourTarget(id, { x, y, width, height });
      }
    });
  }, [id, active]);

  useEffect(() => {
    if (!active) {
      clearTourTarget(id);
      return;
    }
    const t = requestAnimationFrame(report);
    return () => cancelAnimationFrame(t);
  }, [active, id, report]);

  useEffect(() => () => clearTourTarget(id), [id]);

  return (
    <View ref={ref} collapsable={false} onLayout={active ? report : undefined} style={style}>
      {children}
    </View>
  );
}
