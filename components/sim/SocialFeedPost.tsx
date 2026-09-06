import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Animated, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  TextField,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { inferDetailHref } from "@/lib/sim/marketRoutes";
import { backdropIn, backdropOut, sheetEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { addSocialComment, ensurePostMeta, toggleLike, usePostSocial } from "@/lib/sim/socialFeedStore";
import { IosShareSheet, shareMessage } from "@/components/sim/IosShareSheet";
import { GifEndAccessory, GifKeyboard, IosKeyboard, useGifSearch } from "@/components/sim/SocialComposer";
import { ShareableTradeCard, SOCIAL_DEMO_HANDLE, type ShareableTrade } from "@/components/sim/ShareableTradeCard";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { geist } from "@/lib/sim/geistFonts";
import { TEXT_FIELD_INPUT_PROPS, textFieldFocusClass } from "@/lib/sim/dsTextField";

function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function withSocialTab(href: string) {
  if (/[?&]tab=/.test(href)) return href.replace(/([?&]tab=)[^&]*/, "$1social");
  return `${href}${href.includes("?") ? "&" : "?"}tab=social`;
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

function copyTradeFromPost(trade: ShareableTrade) {
  const outcome = (trade.title ?? "").split(" \u00b7 ")[0].trim() || "Yes";
  const bearish = /^(down|no|short)$/i.test(outcome);
  const side: "yes" | "no" = bearish ? "no" : "yes";
  const oddsCents =
    trade.oddsCents ??
    (trade.toWin > 0 && trade.cost > 0 ? Math.round((trade.cost / trade.toWin) * 100) : 50);
  const inferred = inferDetailHref(trade.market);
  const returnTo = inferred
    ? withSocialTab(inferred)
    : trade.market
      ? withSocialTab(`/prediction-detail?t=${encodeURIComponent(trade.market)}`)
      : undefined;
  openBetSlip({
    market: trade.market,
    title: outcome,
    oddsCents,
    color: bearish ? colors.red : colors.green,
    side,
    returnTo,
  });
}

export function SocialFeedPost({
  trade,
  tourHighlight = false,
  focus = false,
}: {
  trade: ShareableTrade;
  tourHighlight?: boolean;
  focus?: boolean;
}) {
  const postId = trade.id ?? "post";
  const social = usePostSocial(postId);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!focus || Platform.OS !== "web" || typeof document === "undefined") return;
    const pin = () => document.getElementById(`social-post-${postId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const frame = requestAnimationFrame(pin);
    const later = setTimeout(pin, 120);
    const retry = setTimeout(pin, 480);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
      clearTimeout(retry);
    };
  }, [focus, postId]);

  useEffect(() => {
    if (!trade.id) return;
    if (trade.id.startsWith("demo-")) {
      const first = trade.id.endsWith("0");
      ensurePostMeta(trade.id, {
        likes: first ? 2 : 1,
        comments: first
          ? [
              { author: "jijo25", text: "cooked", createdAt: Date.now() - 8 * 60 * 1000 },
              { author: "wugi95", text: "fade", createdAt: Date.now() - 3 * 60 * 1000 },
            ]
          : [{ author: "0x8f2a", text: "ngmi", createdAt: Date.now() - 40 * 60 * 1000 }],
      });
    } else {
      ensurePostMeta(trade.id);
    }
  }, [trade.id]);

  return (
    <View nativeID={`social-post-${postId}`} style={{ gap: 10 }}>
      <ShareableTradeCard trade={trade} onCopyTrade={() => copyTradeFromPost(trade)} tourHighlight={tourHighlight} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 2, height: 20 }}>
        <FeedAction
          onPress={() => toggleLike(postId)}
          icon={
            <Icon
              name={social.liked ? IconName.HeartFilled : IconName.Heart}
              size={IconSize.Md}
              color={social.liked ? IconColor.ErrorDefault : IconColor.IconAlternative}
            />
          }
          count={social.likeCount}
        />
        <FeedAction
          onPress={() => setCommentsOpen(true)}
          icon={<Icon name={IconName.Messages} size={IconSize.Md} color={IconColor.IconAlternative} />}
          count={social.comments.length}
        />
        <FeedAction
          onPress={() => setShareOpen(true)}
          icon={<Icon name={IconName.Share} size={IconSize.Md} color={IconColor.IconAlternative} />}
        />
      </View>
      <SocialCommentSheet postId={postId} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <IosShareSheet visible={shareOpen} message={shareMessage(trade.market, trade.title)} onClose={() => setShareOpen(false)} />
    </View>
  );
}

function FeedAction({
  onPress,
  icon,
  count,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{ flexDirection: "row", alignItems: "center", height: 20, gap: 6 }}
    >
      <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>{icon}</View>
      {count != null ? (
        <Text
          style={{
            fontFamily: geist.medium,
            fontSize: 13,
            lineHeight: 20,
            color: colors.textMuted,
            includeFontPadding: false,
            textAlignVertical: "center",
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SocialCommentSheet({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { comments } = usePostSocial(postId);
  const [render, setRender] = React.useState(visible);
  const [draft, setDraft] = useState("");
  const draftRef = useRef("");
  const [focused, setFocused] = useState(true);
  const [gifOpen, setGifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const gifs = useGifSearch(query);
  const [gifUrl, setGifUrl] = useState<string | undefined>();
  const enter = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    if (visible) {
      setRender(true);
      sheetEnter(enter).start();
      backdropIn(dim).start();
    } else if (render) {
      backdropOut(dim).start();
      sheetExit(enter).start(({ finished }) => finished && setRender(false));
    }
  }, [visible]);

  const send = () => {
    const text = draftRef.current.trim();
    if (!text && !gifUrl) return;
    addSocialComment(postId, text, "you", gifUrl);
    draftRef.current = "";
    setDraft("");
    setGifUrl(undefined);
    setGifOpen(false);
  };

  if (!render) return null;

  const overlay = (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 }}>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", opacity: dim }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#000",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }) }],
        }}
      >
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.28)" }} />
          <Text style={{ marginTop: 10, fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>Comments</Text>
        </View>
        <ScrollView
          style={{ maxHeight: 280 }}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 14 }}
        >
          {comments.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontFamily: geist.regular, fontSize: 14, textAlign: "center", paddingVertical: 24 }}>
              Be the first to comment
            </Text>
          ) : (
            [...comments].reverse().map((c) => (
              <View key={c.id} style={{ flexDirection: "row", gap: 12 }}>
                <SocialAvatar seed={c.author === "you" ? SOCIAL_DEMO_HANDLE : c.author} size="sm" tappable />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: colors.textPrimary }}>{c.author}</Text>
                    <Text style={{ fontFamily: geist.regular, fontSize: 12, color: colors.textMuted }}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  {c.text ? (
                    <Text style={{ marginTop: 2, fontFamily: geist.regular, fontSize: 14, lineHeight: 19, color: colors.textPrimary }}>
                      {c.text}
                    </Text>
                  ) : null}
                  {c.gifUrl ? (
                    <Image
                      source={{ uri: c.gifUrl }}
                      style={{ marginTop: 6, width: "100%", height: 120, borderRadius: 10, backgroundColor: colors.surface2 }}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
        {gifUrl ? (
          <Image source={{ uri: gifUrl }} style={{ height: 120, marginHorizontal: 12, marginBottom: 8, borderRadius: 12 }} resizeMode="cover" />
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
          <SocialAvatar seed={SOCIAL_DEMO_HANDLE} size="md" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <TextField
              value={draft}
              onChangeText={(t) => {
                draftRef.current = t;
                setDraft(t);
              }}
              placeholder="Add a comment"
              twClassName={textFieldFocusClass(focused)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              inputProps={{
                ...TEXT_FIELD_INPUT_PROPS,
                returnKeyType: "send",
                blurOnSubmit: true,
                onSubmitEditing: send,
                onKeyPress: (e) => interceptEnterSubmit(send, e),
              }}
              endAccessory={<GifEndAccessory open={gifOpen} onPress={() => setGifOpen((v) => !v)} />}
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onPress={send}>
            Comment
          </Button>
        </View>
        {gifOpen ? (
          <GifKeyboard
            query={query}
            onQuery={setQuery}
            gifs={gifs}
            onPick={(url) => {
              setGifUrl(url);
              setGifOpen(false);
            }}
          />
        ) : (
          <IosKeyboard
            onKey={(ch) => {
              draftRef.current += ch;
              setDraft(draftRef.current);
            }}
            onBackspace={() => {
              draftRef.current = draftRef.current.slice(0, -1);
              setDraft(draftRef.current);
            }}
            onReturn={send}
          />
        )}
        <View style={{ height: Math.max(insets.bottom, 8) }} />
      </Animated.View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
