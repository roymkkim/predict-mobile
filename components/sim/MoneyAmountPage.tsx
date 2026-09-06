import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  HeaderStandard,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text as MmText,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { BALANCE } from "@/components/sim/MoneySheet";
import {
  PayWithMethodIcon,
  PAY_WITH_BALANCE,
  PAY_WITH_LABEL,
  PayWithSheet,
  type PayWithMethod,
} from "@/components/sim/PayWithSheet";
import { colors } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;
const PERCENTS = [
  { label: "10%", value: 0.1 },
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "Max", value: 1 },
] as const;

const AVAILABLE = 123.12;

function formatAmount(raw: string): string {
  if (!raw || raw === ".") return "0";
  return raw;
}

export function MoneyAmountPage({ mode }: { mode: "add" | "withdraw" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState("");
  const [payWithOpen, setPayWithOpen] = useState(false);
  const [payWith, setPayWith] = useState<PayWithMethod>("adai");
  const amount = formatAmount(raw);
  const numeric = Number.parseFloat(amount) || 0;
  const empty = numeric <= 0;
  const isAdd = mode === "add";
  const title = isAdd ? "Add Prediction funds" : "Withdraw";
  const cta = isAdd ? "Continue" : "Withdraw";
  const rowLabel = isAdd ? "Pay with" : "Receive as";

  const onKey = (key: string) => {
    if (key === "⌫") {
      setRaw((value) => value.slice(0, -1));
      return;
    }
    if (key === "." && raw.includes(".")) return;
    if (raw.replace(".", "").length >= 8) return;
    setRaw((value) => `${value}${key}`);
  };

  const display = useMemo(() => {
    const [whole, fraction] = amount.split(".");
    const withCommas = Number.parseInt(whole || "0", 10).toLocaleString("en-US");
    return fraction !== undefined ? `${withCommas}.${fraction}` : withCommas;
  }, [amount]);

  return (
    <Box twClassName="flex-1 bg-default">
      <View style={{ paddingTop: screenTopInset(insets.top), backgroundColor: colors.bg }}>
        <HeaderStandard title={title} onBack={() => router.back()} />
      </View>

      <Box twClassName="flex-1 px-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text
            style={{
              fontFamily: geist.medium,
              fontSize: display.length <= 8 ? 64 : 40,
              lineHeight: display.length <= 8 ? 70 : 44,
              color: empty ? colors.textMuted : colors.textPrimary,
              textAlign: "center",
            }}
          >
            ${display}
          </Text>
          <MmText variant={TextVariant.BodyMd} color={TextColor.TextAlternative} twClassName="mt-2 text-center">
            {`Available balance: ${BALANCE}`}
          </MmText>
        </View>

        <Pressable
          onPress={() => setPayWithOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${rowLabel} ${PAY_WITH_LABEL[payWith]}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            paddingHorizontal: 8,
            marginBottom: 8,
          }}
        >
          <MmText variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {rowLabel}
          </MmText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <PayWithMethodIcon method={payWith} size={20} />
            <MmText variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} color={TextColor.TextDefault}>
              {PAY_WITH_LABEL[payWith]}
              <MmText color={TextColor.TextAlternative}>{` (${PAY_WITH_BALANCE[payWith]})`}</MmText>
            </MmText>
            <Icon name={IconName.ArrowDown} size={IconSize.Sm} color={IconColor.IconAlternative} />
          </View>
        </Pressable>

        <Box twClassName="mt-2 flex-row gap-2">
          {PERCENTS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => setRaw((AVAILABLE * item.value).toFixed(item.value === 1 ? 2 : 0))}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>{item.label}</Text>
            </Pressable>
          ))}
        </Box>

        <Box twClassName="mt-6 flex-row flex-wrap">
          {KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => onKey(key)}
              style={{
                width: "33.33%",
                height: 56,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 24, color: colors.textPrimary }}>{key}</Text>
            </Pressable>
          ))}
        </Box>
      </Box>

      <Box twClassName="px-4 pb-8">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isDisabled={numeric <= 0}
          onPress={() => router.back()}
        >
          {cta}
        </Button>
      </Box>
      <PayWithSheet
        visible={payWithOpen}
        selected={payWith}
        onSelect={setPayWith}
        onClose={() => setPayWithOpen(false)}
        variant={isAdd ? "pay" : "receive"}
      />
    </Box>
  );
}
