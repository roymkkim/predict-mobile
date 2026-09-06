import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { backdropIn, backdropOut, createSheetHeaderPan, detentEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { closePayWith, setPayWithMethod, usePayWith } from "@/lib/sim/payWithStore";

export type PayWithMethod = "money" | "usdc" | "adai";

export const PAY_WITH_LABEL: Record<PayWithMethod, string> = {
  money: "Money account",
  usdc: "USDC",
  adai: "ADAI",
};

export const PAY_WITH_BALANCE: Record<PayWithMethod, string> = {
  money: "$3.47",
  usdc: "$123.12",
  adai: "$11.77",
};

export function payWithRowValue(method: PayWithMethod): string {
  return `${PAY_WITH_LABEL[method]} (${PAY_WITH_BALANCE[method]})`;
}

export function MoneyMark({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#6D28D9",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        name={IconName.Musd}
        size={size <= 24 ? IconSize.Sm : IconSize.Md}
        color={IconColor.IconInverse}
      />
    </View>
  );
}

export function UsdcMark({ size = 40 }: { size?: number }) {
  const fontSize = Math.max(9, Math.round(size * 0.45));
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#2775CA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        variant={size <= 20 ? TextVariant.BodyXs : TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextInverse}
        style={{ fontSize, lineHeight: fontSize + 2 }}
      >
        $
      </Text>
    </View>
  );
}

export function PayWithMethodIcon({ method, size = 16 }: { method: PayWithMethod; size?: number }) {
  if (method === "money") return <MoneyMark size={size} />;
  if (method === "adai") return <AdaiMark size={size} />;
  return <UsdcMark size={size} />;
}

export function AdaiMark({ size = 40 }: { size?: number }) {
  const coin = Math.round(size * 0.8);
  const badge = Math.round(size * 0.4);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: coin, height: coin, borderRadius: coin / 2, backgroundColor: "#F5C518" }} />
      <View
        style={{
          position: "absolute",
          right: 2,
          bottom: 2,
          width: badge,
          height: badge,
          borderRadius: badge / 2,
          backgroundColor: "#3B82F6",
          borderWidth: 2,
          borderColor: colors.surface,
        }}
      />
    </View>
  );
}

function OtherAssetsMark() {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
        $
      </Text>
    </View>
  );
}

function PayRow({
  icon,
  title,
  subtitle,
  selected,
  trailing,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  selected?: boolean;
  trailing: "check" | "chevron" | "none";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: selected ? colors.surface2 : "transparent",
      }}
    >
      {icon}
      <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} color={TextColor.TextDefault}>
          {title}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {subtitle}
        </Text>
      </View>
      {trailing === "check" ? (
        <Icon name={IconName.Check} size={IconSize.Md} color={IconColor.IconDefault} />
      ) : trailing === "chevron" ? (
        <Icon name={IconName.ArrowRight} size={IconSize.Md} color={IconColor.IconAlternative} />
      ) : (
        <View style={{ width: 24 }} />
      )}
    </Pressable>
  );
}

/** Presentational Pay with sheet matching production Add Prediction funds. */
export function PayWithSheet({
  visible,
  selected,
  onSelect,
  onClose,
  variant = "pay",
}: {
  visible: boolean;
  selected: PayWithMethod;
  onSelect: (method: PayWithMethod) => void;
  onClose: () => void;
  variant?: "pay" | "receive";
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const insets = useSafeAreaInsets();
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const headerPan = useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => onCloseRef.current(),
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setRender(true);
      dragY.setValue(0);
    } else {
      Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, fade, slide, dragY]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([detentEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || 400, 0] }),
    dragY,
  );

  if (!render) return null;

  const pick = (method: PayWithMethod) => {
    onSelect(method);
    onClose();
  };

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View {...headerPan.panHandlers} style={{ paddingTop: 10 }}>
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              twClassName="px-4 pb-2"
            >
              <Text
                variant={TextVariant.HeadingSm}
                {...oswald}
                style={{ fontFamily: displayFont }}
              >
                {variant === "receive" ? "Receive" : "Pay with"}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityLabel="Close"
                style={{ position: "absolute", right: 12, height: 32, width: 32, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name={IconName.Close} size={IconSize.Md} color={IconColor.IconDefault} />
              </Pressable>
            </Box>
          </View>

          <PayRow
            icon={<MoneyMark />}
            title="Money account"
            subtitle="$3.47 available"
            selected={selected === "money"}
            trailing={selected === "money" ? "check" : "none"}
            onPress={() => pick("money")}
          />
          <Box twClassName="py-2">
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              twClassName="px-4 pb-2 tracking-wider"
            >
              CRYPTO
            </Text>
            <PayRow
              icon={<UsdcMark />}
              title="USDC"
              subtitle="$123.12 available"
              selected={selected === "usdc"}
              trailing={selected === "usdc" ? "check" : "none"}
              onPress={() => pick("usdc")}
            />
            <PayRow
              icon={<AdaiMark />}
              title="ADAI"
              subtitle="$11.77 available"
              selected={selected === "adai"}
              trailing={selected === "adai" ? "check" : "none"}
              onPress={() => pick("adai")}
            />
            <PayRow
              icon={<OtherAssetsMark />}
              title="Other assets"
              subtitle={variant === "receive" ? "Select the token you want to receive" : "Select from your tokens"}
              trailing="chevron"
              onPress={onClose}
            />
          </Box>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Root-mounted so the sheet stacks above the bet-slip Modal and combo tray. */
export function PayWithHost() {
  const { open, selected } = usePayWith();
  return (
    <PayWithSheet
      visible={open}
      selected={selected}
      onSelect={setPayWithMethod}
      onClose={closePayWith}
    />
  );
}
