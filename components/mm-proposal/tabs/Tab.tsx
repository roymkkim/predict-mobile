import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Pressable, View, type LayoutChangeEvent, type PressableProps } from "react-native";
import { useTailwind } from "@metamask/design-system-twrnc-preset";
import { FontWeight, Text, TextVariant } from "@metamask/design-system-react-native";

import { clearTourTarget, setTourTarget, useSocialTour } from "@/lib/sim/socialTourStore";

export type TabProps = PressableProps & {
  label: string;
  isActive: boolean;
  isDisabled?: boolean;
  leading?: ReactNode;
  tourId?: string;
  onPress: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function Tab({
  label,
  isActive,
  isDisabled = false,
  leading,
  onPress,
  testID,
  onLayout,
  tourId,
  ...pressableProps
}: TabProps) {
  const tw = useTailwind();
  const viewRef = useRef<View>(null);
  const { active: tourActive } = useSocialTour();

  const reportTour = useCallback(() => {
    if (!tourId || !tourActive) return;
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setTourTarget(tourId, { x, y, width, height });
      }
    });
  }, [tourId, tourActive]);

  useEffect(() => {
    if (!tourId) return;
    if (!tourActive) {
      clearTourTarget(tourId);
      return;
    }
    const t = requestAnimationFrame(reportTour);
    return () => cancelAnimationFrame(t);
  }, [tourActive, tourId, reportTour]);

  useEffect(() => {
    if (!tourId) return;
    return () => clearTourTarget(tourId);
  }, [tourId]);

  const handleOnLayout = useCallback(
    (layoutEvent: LayoutChangeEvent) => {
      onLayout?.(layoutEvent);
      reportTour();
    },
    [onLayout, reportTour],
  );

  const labelEl = (
    <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} numberOfLines={1}>
      {label}
    </Text>
  );

  return (
    <View ref={viewRef} collapsable={false} onLayout={handleOnLayout} style={tw.style("flex-shrink-0")}>
      <Pressable
        style={tw.style("relative flex-row items-center justify-center gap-1.5 px-0 pt-0 pb-1", isDisabled && "opacity-50")}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        testID={testID}
        {...pressableProps}
      >
        <View style={tw.style("flex-row items-center gap-1.5 opacity-0")}>
          {leading}
          {labelEl}
        </View>
        <View
          style={tw.style("absolute inset-0 flex-row items-center justify-center gap-1.5")}
          testID={testID ? `${testID}-label` : undefined}
        >
          {leading}
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            twClassName={isDisabled ? "text-muted" : isActive ? "text-default" : "text-alternative"}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
