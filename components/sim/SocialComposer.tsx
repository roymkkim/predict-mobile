import { useEffect, useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { darkTheme } from "@metamask/design-tokens";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  HeaderStandard,
  TextFieldSearch,
} from "@metamask/design-system-react-native";

import { TEXT_FIELD_INPUT_PROPS } from "@/lib/sim/dsTextField";

import { colors } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { addSocialPost } from "@/lib/sim/socialFeedStore";
import { ShareableTradeCard, SOCIAL_DEMO_HANDLE, type ShareableTrade } from "@/components/sim/ShareableTradeCard";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { geist } from "@/lib/sim/geistFonts";

const FOCUS_BORDER = darkTheme.colors.primary.default;
const REST_BORDER = darkTheme.colors.border.muted;

const TENOR = "https://g.tenor.com/v1/search?key=LIVDSRZULELA&limit=18&media_filter=minimal";
const FALLBACK_GIFS = [
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
  "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  "https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif",
];

const KEYS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export function gifUrlFromTenor(row: { media?: { gif?: { url?: string }; tinygif?: { url?: string } }[] }): string | null {
  const media = row.media?.[0];
  return media?.tinygif?.url ?? media?.gif?.url ?? null;
}

export function GifEndAccessory({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="GIF"
      style={{
        height: 28,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: open ? "#fff" : "rgba(255,255,255,0.55)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: geist.bold, fontSize: 12, color: "#fff" }}>GIF</Text>
    </Pressable>
  );
}

export function useGifSearch(query: string) {
  const [gifs, setGifs] = useState<string[]>(FALLBACK_GIFS);
  useEffect(() => {
    let cancelled = false;
    const q = query.trim() || "celebration";
    fetch(`${TENOR}&q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((json) => {
        const urls = (json?.results ?? []).map(gifUrlFromTenor).filter((u: string | null): u is string => !!u);
        if (!cancelled && urls.length) setGifs(urls);
      })
      .catch(() => {
        if (!cancelled) setGifs(FALLBACK_GIFS);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);
  return gifs;
}

export function SocialComposer({
  trade,
  onClose,
  onPosted,
}: {
  trade: ShareableTrade;
  onClose: () => void;
  onPosted: (next: ShareableTrade) => void;
}) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState("");
  const [focused, setFocused] = useState(true);
  const [gifOpen, setGifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const gifs = useGifSearch(query);
  const [gifUrl, setGifUrl] = useState<string | undefined>();

  const post = () => {
    const created = addSocialPost({
      market: trade.market,
      title: trade.title ?? "Your pick",
      cost: trade.cost,
      toWin: trade.toWin,
      logo: trade.logo,
      flag: trade.flag,
      caption: caption.trim(),
      gifUrl,
    });
    onPosted({ ...trade, id: created.id, caption: caption.trim(), gifUrl });
  };

  return (
    <View nativeID="slides-share-composer" style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: screenTopInset(insets.top) }}>
        <HeaderStandard title="Share post" onBack={onClose} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingTop: 16 }}>
        <SocialAvatar seed={SOCIAL_DEMO_HANDLE} size="md" />
        <View
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: focused ? FOCUS_BORDER : REST_BORDER,
            padding: 10,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Share your thoughts"
              placeholderTextColor={colors.textMuted}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              showSoftInputOnFocus={false}
              style={{
                flex: 1,
                minWidth: 0,
                paddingVertical: 4,
                fontFamily: geist.regular,
                fontSize: 16,
                lineHeight: 22,
                color: colors.textPrimary,
                ...(Platform.OS === "web"
                  ? ({ outlineStyle: "none", outlineWidth: 0 } as Record<string, string | number>)
                  : null),
              }}
            />
            <GifEndAccessory open={gifOpen} onPress={() => setGifOpen((v) => !v)} />
          </View>
          {gifUrl ? (
            <Image source={{ uri: gifUrl }} style={{ height: 140, borderRadius: 12 }} resizeMode="cover" />
          ) : null}
          <View pointerEvents="none">
            <ShareableTradeCard trade={trade} showAuthor={false} />
          </View>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onPress={post}>
          Post
        </Button>
      </View>
      {gifOpen ? (
        <GifKeyboard query={query} onQuery={setQuery} gifs={gifs} onPick={(url) => { setGifUrl(url); setGifOpen(false); }} />
      ) : (
        <IosKeyboard
          onKey={(ch) => setCaption((s) => s + ch)}
          onBackspace={() => setCaption((s) => s.slice(0, -1))}
          onReturn={post}
        />
      )}
    </View>
  );
}

export function GifKeyboard({
  query,
  onQuery,
  gifs,
  onPick,
}: {
  query: string;
  onQuery: (q: string) => void;
  gifs: string[];
  onPick: (url: string) => void;
}) {
  return (
    <View style={{ height: 280, backgroundColor: "#1c1c1e", paddingTop: 8 }}>
      <View style={{ marginHorizontal: 12, marginBottom: 8 }}>
        <TextFieldSearch
          value={query}
          onChangeText={onQuery}
          placeholder="Search GIFs"
          onPressClearButton={() => onQuery("")}
          inputProps={TEXT_FIELD_INPUT_PROPS}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 8, flexDirection: "row", flexWrap: "wrap" }}>
        {gifs.map((uri) => (
          <Pressable key={uri} onPress={() => onPick(uri)} style={{ width: "33.33%", padding: 4 }}>
            <Image source={{ uri }} style={{ width: "100%", height: 84, borderRadius: 8, backgroundColor: "#2c2c2e" }} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function IosKeyboard({
  onKey,
  onBackspace,
  onReturn,
}: {
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onReturn: () => void;
}) {
  const key = (label: string, onPress: () => void, flex = 1, wide = false) => (
    <Pressable
      key={label}
      onPressIn={onPress}
      {...(Platform.OS === "web"
        ? {
            onMouseDown: (e: { preventDefault?: () => void }) => e.preventDefault?.(),
          }
        : null)}
      style={{
        flex: wide ? 3 : flex,
        height: 42,
        marginHorizontal: 3,
        borderRadius: 6,
        backgroundColor: label.length === 1 ? "#3a3a3c" : "#2c2c2e",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontFamily: geist.regular, fontSize: label.length === 1 ? 20 : 15, textTransform: "capitalize" }}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: "#1c1c1e", paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4, gap: 8 }}>
      {KEYS.slice(0, 2).map((row, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "center", paddingHorizontal: i === 1 ? 16 : 0 }}>
          {row.map((ch) => key(ch, () => onKey(ch)))}
        </View>
      ))}
      <View style={{ flexDirection: "row", justifyContent: "center", paddingHorizontal: 36 }}>
        {KEYS[2].map((ch) => key(ch, () => onKey(ch)))}
        {key("⌫", onBackspace, 1.3)}
      </View>
      <View style={{ flexDirection: "row" }}>
        {key("123", () => undefined, 1.2)}
        {key("space", () => onKey(" "), 1, true)}
        {key("return", onReturn, 1.4)}
      </View>
    </View>
  );
}
