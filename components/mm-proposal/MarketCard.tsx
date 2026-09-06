import {
  Box,
  ButtonSemantic,
  ButtonSemanticSeverity,
  ButtonSize,
  FontWeight,
  Tag,
  TagSeverity,
  Text,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import { PREDICTION_DETAIL_HREF } from "@/lib/sim/marketRoutes";
import { useTopControls } from "@/lib/sim/feedTopControlsStore";
import { useMmProposalControls } from "@/lib/sim/mmProposalStore";
import type { Binary } from "@/lib/sim/topicMarkets";

export function MarketCard({ market }: { market: Binary }) {
  const router = useRouter();
  const { showFooter } = useTopControls();
  const { showVolume } = useMmProposalControls();
  const openDetail = () => router.push(PREDICTION_DETAIL_HREF as never);
  const yes = market.match.teams[0];
  const no = market.match.teams[1];

  return (
    <Box twClassName="gap-3 rounded-2xl bg-section p-4 pt-3">
      <Pressable onPress={openDetail} accessibilityRole="button">
        <Text variant={TextVariant.HeadingSm} color={TextColor.TextDefault} numberOfLines={2}>
          {market.title}
        </Text>
      </Pressable>
      <Box twClassName="gap-2">
        <ButtonSemantic
          severity={ButtonSemanticSeverity.Success}
          size={ButtonSize.Lg}
          isFullWidth
          onPress={openDetail}
        >
          {`Yes · ${yes.pct}`}
        </ButtonSemantic>
        <ButtonSemantic
          severity={ButtonSemanticSeverity.Danger}
          size={ButtonSize.Lg}
          isFullWidth
          onPress={openDetail}
        >
          {`No · ${no.pct}`}
        </ButtonSemantic>
      </Box>
      {showFooter ? (
        <Box twClassName="flex-row items-center gap-3">
          {market.match.league ? <Tag severity={TagSeverity.Neutral}>{market.match.league}</Tag> : null}
          {showVolume ? (
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative} fontWeight={FontWeight.Medium}>
              {market.match.vol}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
