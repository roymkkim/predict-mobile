import {
  AvatarBase,
  AvatarBaseShape,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Tag,
  TagSeverity,
  Text,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { useTopControls } from "@/lib/sim/feedTopControlsStore";
import { useMmProposalControls } from "@/lib/sim/mmProposalStore";
import type { Match, Team } from "@/lib/sim/types";

export type GameCardVariant = "compact" | "featured";

function TeamAvatar({ team }: { team: Team }) {
  if (team.logo) {
    return <AvatarFavicon src={{ uri: team.logo }} size={AvatarFaviconSize.Md} />;
  }
  return (
    <AvatarBase
      size={AvatarBaseSize.Md}
      shape={AvatarBaseShape.Square}
      fallbackText={team.abbr ?? team.initial}
    />
  );
}

function TeamAction({ team, onPress }: { team: Team; onPress: () => void }) {
  return (
    <Box twClassName="min-w-0 flex-1">
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        isFullWidth
        onPress={onPress}
      >
        {`${team.abbr ?? team.initial} · ${team.pct}`}
      </Button>
    </Box>
  );
}

export function GameCard({
  match,
  variant = "compact",
}: {
  match: Match;
  variant?: GameCardVariant;
}) {
  const router = useRouter();
  const { showFooter } = useTopControls();
  const { showVolume } = useMmProposalControls();
  const away = match.teams[0];
  const home = match.teams[1];
  const openDetail = () => router.push(matchDetailHref(match) as never);

  if (variant === "featured") {
    return (
      <Box twClassName="gap-3 rounded-2xl bg-section px-4 pb-4 pt-4">
        <Pressable onPress={openDetail} accessibilityRole="button">
          <Text
            variant={TextVariant.HeadingSm}
            color={TextColor.TextDefault}
            numberOfLines={1}
            twClassName="text-center"
          >
            {`${away.name} vs ${home.name}`}
          </Text>
          <Box twClassName="flex-row items-center justify-between py-3">
            <Box twClassName="items-center gap-2">
              <TeamAvatar team={away} />
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {away.name}
              </Text>
            </Box>
            <Box twClassName="items-center gap-1">
              {match.live ? (
                <Tag severity={TagSeverity.Success}>LIVE</Tag>
              ) : (
                <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
                  {match.date}
                </Text>
              )}
              <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
                {match.live?.score
                  ? `${match.live.score[0]}–${match.live.score[1]}`
                  : match.time ?? ""}
              </Text>
            </Box>
            <Box twClassName="items-center gap-2">
              <TeamAvatar team={home} />
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {home.name}
              </Text>
            </Box>
          </Box>
        </Pressable>
        <Box twClassName="flex-row gap-2">
          <TeamAction team={away} onPress={openDetail} />
          <TeamAction team={home} onPress={openDetail} />
        </Box>
      </Box>
    );
  }

  return (
    <Box twClassName="gap-3 rounded-2xl bg-section px-4 pb-4 pt-3">
      <Pressable onPress={openDetail} accessibilityRole="button">
        <Box twClassName="flex-row items-center justify-between pb-1">
          {match.live ? (
            <Box twClassName="flex-row items-center gap-2">
              <Tag severity={TagSeverity.Success}>LIVE</Tag>
              <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
                {match.live.mins}
              </Text>
            </Box>
          ) : (
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {match.time ? `${match.date} · ${match.time}` : match.date}
            </Text>
          )}
        </Box>
        {[away, home].map((team) => (
          <Box key={team.name} twClassName="flex-row items-center gap-3 py-2">
            <TeamAvatar team={team} />
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} twClassName="flex-1">
              {team.name}
            </Text>
            {match.live?.score ? (
              <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>
                {team === away ? match.live.score[0] : match.live.score[1]}
              </Text>
            ) : null}
          </Box>
        ))}
      </Pressable>
      <Box twClassName="flex-row gap-2 pt-1">
        <TeamAction team={away} onPress={openDetail} />
        <TeamAction team={home} onPress={openDetail} />
      </Box>
      {showFooter ? (
        <Box twClassName="flex-row items-center justify-between">
          <Box twClassName="flex-row items-center gap-3">
            <Tag severity={TagSeverity.Neutral}>{match.league}</Tag>
            {showVolume ? (
              <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative} fontWeight={FontWeight.Medium}>
                {match.vol}
              </Text>
            ) : null}
          </Box>
          {match.markets > 1 ? (
            <Pressable onPress={openDetail} accessibilityRole="button">
              <Box twClassName="flex-row items-center gap-1">
                <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
                  {`+${match.markets - 1}`}
                </Text>
              </Box>
            </Pressable>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
