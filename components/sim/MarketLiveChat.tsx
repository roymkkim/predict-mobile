import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Animated, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextVariant,
  FontWeight,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { comboChatComposerInsets, comboPayoutMultipleLabel } from "@/lib/sim/comboAffordance";
import { useComboMode } from "@/lib/sim/comboFlowStore";
import { useComboPicks } from "@/lib/sim/comboPicksStore";
import { geist } from "@/lib/sim/geistFonts";
import { addLiveChatMessage, appendIncomingChat, useLiveChat, type LiveChatMessage } from "@/lib/sim/liveChatStore";
import { sheetEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { SOCIAL_DEMO_HANDLE } from "@/components/sim/ShareableTradeCard";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { TourAnchor } from "@/components/sim/TourAnchor";
import { IOSKeyboard as IosKeyboard, iosKeyboardHeight } from "@/components/sim/IOSKeyboard";
import {
  BUILD_COMBO_FOOTER_GAP,
  BUILD_COMBO_BUTTON_HEIGHT,
  MARKET_ACTION_BUTTON_HEIGHT,
  MARKET_ACTION_FOOTER_BOTTOM_EXTRA,
} from "@/components/sim/MarketActionFooter";

const COMPOSER_PILL_H = 48;
const COMPOSER_BAR = COMPOSER_PILL_H + 12;
const COMPOSER_GAP = 12;
const COMPOSER_BOTTOM_PAD = 40;
const PILL_FILL = "rgba(226,226,255,0.11)";
const PILL_BORDER = "rgba(255,255,255,0.12)";

/** Pixels from the screen bottom (excluding safe-area) up to the composer. */
export function liveChatFooterReserve(withComboButton: boolean): number {
  return (
    MARKET_ACTION_FOOTER_BOTTOM_EXTRA +
    MARKET_ACTION_BUTTON_HEIGHT +
    COMPOSER_GAP +
    (withComboButton ? BUILD_COMBO_FOOTER_GAP + BUILD_COMBO_BUTTON_HEIGHT : 0)
  );
}

/** Yes/No footer only — composer sits 12px above the primary CTAs. */
export const LIVE_CHAT_FOOTER_RESERVE = liveChatFooterReserve(false);

function restComposerBottom(bottomInset: number, footerReserve: number, comboBottom?: number): number {
  if (comboBottom != null) return comboBottom;
  if (footerReserve > 0) {
    return bottomInset + footerReserve;
  }
  return bottomInset + COMPOSER_BOTTOM_PAD;
}

function interceptEnterSubmit(
  onSubmit: () => void,
  e: { nativeEvent: { key: string; shiftKey?: boolean }; preventDefault?: () => void },
) {
  if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
    e.preventDefault?.();
    onSubmit();
  }
}

function timeLabel(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 2) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

function ChatRow({ row, now, animate }: { row: LiveChatMessage; now: number; animate: boolean }) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 8 : 0)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [animate, opacity, translateY]);

  const seed = row.you ? SOCIAL_DEMO_HANDLE : row.author;
  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <SocialAvatar seed={seed} size="md" tappable={!row.you} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} numberOfLines={1}>
            {row.you ? "you" : row.author}
          </Text>
          <Text variant={TextVariant.BodySm} twClassName="text-alternative">
            {timeLabel(row.createdAt, now)}
          </Text>
        </View>
        <Text variant={TextVariant.BodyMd} twClassName="text-default">
          {row.text}
        </Text>
      </View>
    </Animated.View>
  );
}

export function LiveChatComposer({ market, footerReserve = 0 }: { market: string; footerReserve?: number }) {
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboPicks = useComboPicks();
  const payoutLabel = comboPayoutMultipleLabel(comboPicks);
  const comboInsets = comboMode
    ? comboChatComposerInsets(insets.bottom, {
        itemCount: comboPicks.length,
        payoutLabel: comboPicks.length >= 1 ? payoutLabel : undefined,
        safeRight: insets.right,
      })
    : null;
  const [onScreen, setOnScreen] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setOnScreen(true);
      return () => setOnScreen(false);
    }, []),
  );
  const [draft, setDraft] = useState("");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [focused, setFocused] = useState(false);
  const [kbMounted, setKbMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const restBottom = restComposerBottom(insets.bottom, footerReserve, comboInsets?.bottom);
  const kbHeight = iosKeyboardHeight(insets.bottom);

  const openKb = () => {
    setFocused(true);
    setKbMounted(true);
    progress.stopAnimation();
    sheetEnter(progress, false).start();
  };

  const dismiss = () => {
    setFocused(false);
    progress.stopAnimation();
    sheetExit(progress, false).start(({ finished }) => {
      if (finished) setKbMounted(false);
    });
  };

  const send = () => {
    const text = draftRef.current;
    draftRef.current = "";
    setDraft("");
    addLiveChatMessage(market, text);
    dismiss();
  };

  const composerBottom = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [restBottom, kbHeight + COMPOSER_GAP],
  });
  const kbTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [kbHeight, 0],
  });

  if (!onScreen) return null;

  const overlay = (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === "web" ? ("fixed" as unknown as "absolute") : "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 25,
      }}
    >
      {kbMounted ? (
        <Pressable
          onPress={dismiss}
          accessibilityLabel="Hide keyboard"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {kbMounted ? (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            transform: [{ translateY: kbTranslateY }],
          }}
        >
          <IosKeyboard
            mode="qwerty"
            onKey={(ch) => {
              if (ch === "\n" || ch === "\r") {
                send();
                return;
              }
              setDraft((s) => {
                const next = s + ch;
                draftRef.current = next;
                return next;
              });
            }}
            onBackspace={() =>
              setDraft((s) => {
                const next = s.slice(0, -1);
                draftRef.current = next;
                return next;
              })
            }
            onNext={send}
            nextVariant="check"
            bottomInset={insets.bottom}
          />
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 16,
          right: comboInsets?.right ?? 16,
          bottom: composerBottom,
          zIndex: 3,
        }}
      >
        <TourAnchor id="tour-chat-composer" style={{ width: "100%" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: COMPOSER_PILL_H,
              paddingLeft: 4,
              paddingRight: 6,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: PILL_FILL,
              borderWidth: 1,
              borderColor: focused ? colors.accent : PILL_BORDER,
              ...(Platform.OS === "web"
                ? ({
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  } as Record<string, string>)
                : null),
            }}
          >
            <SocialAvatar seed={SOCIAL_DEMO_HANDLE} size="md" />
            <TextInput
              value={draft}
              onChangeText={(t) => {
                draftRef.current = t;
                setDraft(t);
              }}
              placeholder="Say something"
              placeholderTextColor={colors.textMuted}
              multiline={false}
              returnKeyType="send"
              blurOnSubmit
              showSoftInputOnFocus={false}
              onFocus={openKb}
              onSubmitEditing={send}
              onKeyPress={(e) => interceptEnterSubmit(send, e)}
              accessibilityLabel="Chat message"
              style={{
                flex: 1,
                minWidth: 0,
                height: 40,
                paddingHorizontal: 10,
                margin: 0,
                color: colors.textPrimary,
                fontFamily: geist.regular,
                fontSize: 16,
                backgroundColor: "transparent",
                ...(Platform.OS === "web"
                  ? ({ outlineStyle: "none", outlineWidth: 0 } as Record<string, string | number>)
                  : null),
              }}
            />
            <ButtonIcon
              iconName={IconName.Send}
              size={ButtonIconSize.Sm}
              onPress={send}
              accessibilityLabel="Send"
            />
          </View>
        </TourAnchor>
      </Animated.View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}

export function MarketLiveChat({ market, footerReserve = 0 }: { market: string; footerReserve?: number }) {
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboPicks = useComboPicks();
  const payoutLabel = comboPayoutMultipleLabel(comboPicks);
  const comboInsets = comboMode
    ? comboChatComposerInsets(insets.bottom, {
        itemCount: comboPicks.length,
        payoutLabel: comboPicks.length >= 1 ? payoutLabel : undefined,
        safeRight: insets.right,
      })
    : null;
  const rows = useLiveChat(market);
  const scrollRef = useRef<ScrollView>(null);
  const seen = useRef(new Set(rows.map((r) => r.id)));
  const [now, setNow] = useState(() => Date.now());
  const listPadBottom = restComposerBottom(insets.bottom, footerReserve, comboInsets?.bottom) + COMPOSER_BAR + 16;

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        appendIncomingChat(market);
        loop();
      }, 2000 + Math.round(Math.random() * 2000));
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [market]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [rows.length]);

  return (
    <View nativeID="slides-live-chat">
    <ScrollView
      ref={scrollRef}
      style={{ maxHeight: 520 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: listPadBottom, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {rows.map((row) => {
        const animate = !seen.current.has(row.id);
        if (animate) seen.current.add(row.id);
        return <ChatRow key={row.id} row={row} now={now} animate={animate} />;
      })}
    </ScrollView>
    </View>
  );
}
