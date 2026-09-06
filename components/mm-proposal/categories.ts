import { IconName } from "@metamask/design-system-react-native";

import type { MaterialCommunityIconName, MaterialIconName } from "@/lib/sim/uxrIcons";

export type MmProposalCategory = {
  id: string;
  label: string;
  iconName?: IconName;
  /** Classic MaterialIcons (filled). Prefer community outline when matching DS tiles. */
  materialIcon?: MaterialIconName;
  /** MaterialCommunity outline glyphs when the DS set has no match (e.g. baseball). */
  communityIcon?: MaterialCommunityIconName;
  href: string;
  /** Home-tile shortcut into a nested hub; omitted from the Categories browse list. */
  subcategory?: boolean;
};

/** Home Categories carousel: primary hubs, extra topics, then More. */
export const MM_PROPOSAL_CATEGORIES: readonly MmProposalCategory[] = [
  { id: "politics", label: "Politics", iconName: IconName.Global, href: "/uxr-hub/politics" },
  { id: "nfl", label: "NFL", href: "/uxr-sport/football?league=NFL", subcategory: true },
  { id: "mlb", label: "MLB", href: "/uxr-sport/baseball?league=MLB", subcategory: true },
  { id: "sports", label: "Sports", iconName: IconName.Trophy, href: "/uxr-categories?sports=1" },
  { id: "crypto", label: "Crypto", iconName: IconName.MoneyBag, href: "/uxr-hub/crypto" },
  { id: "esports", label: "Esports", iconName: IconName.Joystick, href: "/esports", subcategory: true },
  { id: "culture", label: "Culture", iconName: IconName.Palette, href: "/topic/culture" },
  { id: "finance", label: "Finance", iconName: IconName.Bank, href: "/topic/finance" },
  { id: "tech", label: "Tech", iconName: IconName.Ai, href: "/topic/tech" },
];

export const MM_PROPOSAL_BROWSE_CATEGORIES = MM_PROPOSAL_CATEGORIES.filter(
  (category) => !category.subcategory && category.id !== "sports",
);

export const MM_PROPOSAL_MORE_CATEGORY: MmProposalCategory = {
  id: "more",
  label: "More",
  iconName: IconName.ArrowRight,
  href: "/uxr-categories",
};
