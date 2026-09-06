# MM Proposal — MetaMask component discrepancies

Rebuilt the **MM Proposal** (`polymarket-sport-pages`) sport IA in `components/mm-proposal/` using `@metamask/design-system-react-native` only.

## Used as-is

| Surface | DS component |
|---|---|
| Theme | `ThemeProvider` from `@metamask/design-system-twrnc-preset` |
| Page header | `HeaderSubpage` |
| Section titles | `SectionHeader` |
| Search | `TextFieldSearch` |
| League / Live chips | `FilterButton` + `FilterButtonGroup` |
| Games / Props | `SegmentedControl` + `FilterButton` |
| League rows | `ListItem` |
| Settings sheet | RN `Modal` + `HeaderStandard` (DS `BottomSheet` skipped; Expo reanimated 4.1 vs DS 4.2) |
| Settings options | `SegmentedControl`, `FilterButton`, `Switch` |
| Copy | `Text` |
| Layout | `Box` |
| Team logos | `AvatarFavicon` / `AvatarBase` |
| League / LIVE labels | `Tag` |
| Team odds | `Button` (`Secondary`) |
| Yes / No | `ButtonSemantic` |
| Category icons | `Icon` |

## Custom (no DS equivalent)

| Need | What we did | Suggested follow-up |
|---|---|---|
| Category destination tiles | `Pressable` wrapping `Box` + `Icon` + `Text`, matching Predict home Categories | Official tile / `MainActionButton` variant if DS adds one |
| Game probability bar | Omitted on compact cards | Custom chart if product wants Versus-style bars |
| Live scoreboard (bases, possession, glow) | Not ported | Custom; DS has no sports scoreboard |
| Horizontal snap carousels | Plain `ScrollView` | Keep custom; DS has no snap rail |
| Retro-Mac settings FAB | Unchanged debug affordance | Out of product UI |
| Team color fills on bet buttons | Neutral `Button Secondary` instead of team-tinted pills | Custom if UXR requires brand colors on actions |
| `react-native-reanimated` 4.2 peer | Expo 54 still pins `~4.1.1` | Watch for Expo bump; DS BottomSheet may miss some motion |

## Not in this slice

- Legacy VersusCard / StandardCard chrome (accents, breath, score glow)
- Kalshi and classic Polymarket IAs — still the previous custom surfaces
- Bet slip, onboarding, money sheet
