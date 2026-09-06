import { useLocalSearchParams, useRouter } from "expo-router";

import { LeagueDirectory } from "@/components/mm-proposal/SportPage";
import { queueSportLeagueSelection } from "@/lib/sim/sportLeagueSelectStore";

export default function UxrLeaguesScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const sportSlug = typeof slug === "string" && slug.length > 0 ? slug : "soccer";

  return (
    <LeagueDirectory
      onBack={() => router.back()}
      onSelect={(name) => {
        queueSportLeagueSelection(sportSlug, name);
        router.back();
      }}
    />
  );
}
