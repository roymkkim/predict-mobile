import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, IconColor, IconName, IconSize } from "@metamask/design-system-react-native";

import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { SocialFeedPost } from "@/components/sim/SocialFeedPost";
import { TabsBar } from "@/components/mm-proposal/tabs";
import { colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { screenTopInset } from "@/lib/sim/layout";
import { toggleFollow, useFollowing } from "@/lib/sim/socialFollowStore";
import { useSocialFeed } from "@/lib/sim/socialFeedStore";
import {
  demoCopiesForAuthor,
  demoPostsForAuthor,
  demoRepliesForAuthor,
  formatCount,
  formatPnl,
  profileFor,
} from "@/lib/sim/socialProfiles";
import { StickyDetailScroll } from "@/components/sim/StickyDetailScroll";

const TABS = [
  { key: "posts", label: "Posts" },
  { key: "replies", label: "Replies" },
  { key: "copies", label: "Copies" },
] as const;

export default function SocialProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const author = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "Cented";
  const profile = profileFor(author ?? "Cented");
  const following = useFollowing(profile.id);
  const posted = useSocialFeed();
  const [tab, setTab] = useState(0);

  const posts = useMemo(() => {
    if (profile.displayName === "You") {
      return posted.map((p) => ({
        id: p.id,
        market: p.market,
        title: p.title,
        cost: p.cost,
        toWin: p.toWin,
        logo: p.logo,
        flag: p.flag,
        caption: p.caption,
        gifUrl: p.gifUrl,
        author: profile.displayName,
        timeLabel: "just now",
      }));
    }
    return demoPostsForAuthor(profile.id);
  }, [posted, profile.displayName, profile.id]);

  const replies = demoRepliesForAuthor(profile.id);
  const copies = demoCopiesForAuthor(profile.id);
  const pnlPositive = profile.pnl > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StickyDetailScroll
        topInset={screenTopInset(insets.top)}
        paddingBottom={40}
        header={
          <View style={{ paddingHorizontal: 8 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name={IconName.ArrowLeft} size={IconSize.Lg} color={IconColor.IconDefault} />
            </Pressable>
          </View>
        }
      >
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <SocialAvatar seed={profile.id} size="lg" />
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontFamily: geist.semibold, fontSize: 22, color: colors.textPrimary }}>
                {profile.displayName}
              </Text>
              {profile.showX ? (
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    backgroundColor: "#3A3A3E",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontFamily: geist.bold, fontSize: 10, lineHeight: 12 }}>𝕏</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontFamily: geist.regular, fontSize: 15, color: colors.textMuted }}>{profile.handle}</Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 21, color: colors.textPrimary }}>
              {profile.bio}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <Stat value={`${profile.winRate}%`} label="Win Rate" />
            <Divider />
            <Stat value={formatPnl(profile.pnl)} label="PnL" valueColor={pnlPositive ? colors.green : colors.red} />
            <Divider />
            <Stat value={profile.holdTime} label="Hold Time" />
            <Divider />
            <Stat value={formatCount(profile.copies)} label="Copies" />
          </View>

          <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>
            <Text style={{ fontFamily: geist.semibold, color: colors.textPrimary }}>{formatCount(profile.followers)}</Text>
            {" followers · "}
            <Text style={{ fontFamily: geist.semibold, color: colors.textPrimary }}>{formatCount(profile.followingCount)}</Text>
            {" following"}
          </Text>

          <Pressable
            onPress={() => toggleFollow(profile.id)}
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: following ? ON_SURFACE_BUTTON_BG : "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: geist.medium,
                fontSize: 16,
                color: following ? colors.textPrimary : "#000",
              }}
            >
              {following ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 20 }}>
          <TabsBar tabs={[...TABS]} activeIndex={tab} onTabPress={setTab} />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 8 }} />
        </View>

        {tab === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 22, paddingBottom: 24 }}>
            {posts.length === 0 ? (
              <Empty text="No posts yet" />
            ) : (
              posts.map((trade, i) => <SocialFeedPost key={trade.id ?? i} trade={trade} />)
            )}
          </View>
        ) : null}

        {tab === 1 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14, paddingBottom: 24 }}>
            {replies.length === 0 ? (
              <Empty text="No replies yet" />
            ) : (
              replies.map((r) => (
                <View key={r.id} style={{ flexDirection: "row", gap: 12 }}>
                  <SocialAvatar seed={profile.id} size="md" tappable={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: geist.regular, fontSize: 15, color: colors.textPrimary }}>{r.text}</Text>
                    <Text style={{ marginTop: 4, fontFamily: geist.regular, fontSize: 12, color: colors.textMuted }}>
                      {r.ago}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 2 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14, paddingBottom: 24 }}>
            {copies.length === 0 ? (
              <Empty text="No copies yet" />
            ) : (
              copies.map((c) => (
                <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <SocialAvatar seed={c.who} size="md" tappable />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>{c.who}</Text>
                    <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted }}>
                      Copied a trade · {c.ago}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </StickyDetailScroll>
    </View>
  );
}

function Stat({ value, label, valueColor }: { value: string; label: string; valueColor?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: valueColor ?? colors.textPrimary }}>{value}</Text>
      <Text style={{ fontFamily: geist.regular, fontSize: 12, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 4 }} />;
}

function Empty({ text }: { text: string }) {
  return (
    <Text style={{ color: colors.textMuted, fontFamily: geist.regular, fontSize: 14, textAlign: "center", paddingVertical: 24 }}>
      {text}
    </Text>
  );
}
