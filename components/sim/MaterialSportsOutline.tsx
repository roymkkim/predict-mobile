import Svg, { Circle, Path, Rect } from "react-native-svg";

/** Google Material Icons Outlined sport glyphs (24px optical). Expo has no MaterialIconsOutlined set. */
export type OutlinedSportId =
  | "baseball"
  | "soccer"
  | "cricket"
  | "basketball"
  | "football"
  | "hockey"
  | "rugby"
  | "mma"
  | "tennis"
  | "golf"
  | "esports"
  | "motorsports";

const KEY_TO_GLYPH: Record<string, OutlinedSportId> = {
  baseball: "baseball",
  "sports-baseball": "baseball",
  mlb: "baseball",
  combat: "mma",
  mma: "mma",
  boxing: "mma",
  "sports-mma": "mma",
  "sports-martial-arts": "mma",
  soccer: "soccer",
  "sports-soccer": "soccer",
  cricket: "cricket",
  "sports-cricket": "cricket",
  basketball: "basketball",
  "sports-basketball": "basketball",
  football: "football",
  nfl: "football",
  americanFootball: "football",
  "sports-football": "football",
  hockey: "hockey",
  "sports-hockey": "hockey",
  rugby: "rugby",
  aussieRules: "rugby",
  "sports-rugby": "rugby",
  tennis: "tennis",
  "sports-tennis": "tennis",
  tabletennis: "tennis",
  pickleball: "tennis",
  golf: "golf",
  "sports-golf": "golf",
  esports: "esports",
  "sports-esports": "esports",
  nascar: "motorsports",
  motorsports: "motorsports",
  racing: "motorsports",
  "sports-motorsports": "motorsports",
};

export function outlinedSportId(key: string | undefined): OutlinedSportId | undefined {
  if (!key) return undefined;
  return KEY_TO_GLYPH[key];
}

function Glyph({ id, color }: { id: OutlinedSportId; color: string }) {
  switch (id) {
    case "baseball":
      return (
        <Path
          fill={color}
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM5.61 16.78C4.6 15.45 4 13.8 4 12s.6-3.45 1.61-4.78C7.06 8.31 8 10.05 8 12s-.94 3.69-2.39 4.78zM12 20c-1.89 0-3.63-.66-5-1.76 1.83-1.47 3-3.71 3-6.24S8.83 7.23 7 5.76C8.37 4.66 10.11 4 12 4s3.63.66 5 1.76c-1.83 1.47-3 3.71-3 6.24s1.17 4.77 3 6.24C15.63 19.34 13.89 20 12 20zm6.39-3.22C16.94 15.69 16 13.95 16 12s.94-3.69 2.39-4.78C19.4 8.55 20 10.2 20 12s-.6 3.45-1.61 4.78z"
        />
      );
    case "soccer":
      return (
        <Path
          fill={color}
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.3 1.35-.95c1.82.56 3.37 1.76 4.38 3.34l-.39 1.34-1.35.46L13 6.7V5.3zM9.65 4.35 11 5.3v1.4L7.01 9.49l-1.35-.46-.39-1.34C6.28 6.12 7.83 4.92 9.65 4.35zM7.08 17.11l-1.14.1C4.73 15.81 4 13.99 4 12c0-.12.01-.23.02-.35l1-.73L6.4 11.4l1.46 4.34-.78 1.37zM14.5 19.59c-.79.26-1.63.41-2.5.41s-1.71-.15-2.5-.41l-.69-1.49L9.45 17h5.11l.64 1.11.3 1.48zM14.27 15H9.73l-1.35-4.02L12 8.44l3.63 2.54L14.27 15zm3.79 2.21-1.14-.1-.79-1.37 1.46-4.34 1.39-.47 1 .73C19.99 11.77 20 11.88 20 12c0 1.99-.73 3.81-1.94 5.21z"
        />
      );
    case "cricket":
      return (
        <>
          <Path
            fill={color}
            d="M15.04 12.79l-8.5-8.5C6.35 4.1 6.09 4 5.83 4S5.32 4.1 5.13 4.29L2.29 7.13c-.39.39-.39 1.03 0 1.42l8.5 8.5c.2.2.45.29.71.29.26 0 .51-.1.71-.29l2.83-2.83c.39-.39.39-1.03 0-1.43zM11.5 14.92 4.41 7.83l1.42-1.42 7.09 7.09-1.42 1.42z"
          />
          <Rect
            x={16.17}
            y={16.17}
            width={2}
            height={6}
            fill={color}
            transform="matrix(0.7071 -0.7071 0.7071 0.7071 -8.5264 17.7562)"
          />
          <Path
            fill={color}
            d="M18.5 2C16.57 2 15 3.57 15 5.5S16.57 9 18.5 9 22 7.43 22 5.5 20.43 2 18.5 2zm0 5C17.67 7 17 6.33 17 5.5S17.67 4 18.5 4 20 4.67 20 5.5 19.33 7 18.5 7z"
          />
        </>
      );
    case "basketball":
      return (
        <Path
          fill={color}
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM5.23 7.75C6.1 8.62 6.7 9.74 6.91 11H4.07c.15-1.18.56-2.28 1.16-3.25zM4.07 13h2.84c-.21 1.26-.81 2.38-1.68 3.25C4.63 15.28 4.22 14.18 4.07 13zM11 19.93c-1.73-.22-3.29-1-4.49-2.14 1.3-1.24 2.19-2.91 2.42-4.79H11v6.93zM11 11H8.93C8.69 9.12 7.81 7.44 6.5 6.2 7.71 5.06 9.27 4.29 11 4.07V11zm8.93 0h-2.84c.21-1.26.81-2.38 1.68-3.25.87.97 1.28 2.07 1.16 3.25zM13 4.07c1.73.22 3.29.99 4.5 2.13-1.31 1.24-2.19 2.92-2.43 4.8H13V4.07zm0 15.86V13h2.07c.24 1.88 1.12 3.55 2.42 4.79C16.29 18.93 14.73 19.71 13 19.93zm5.77-3.68c-.87-.86-1.46-1.99-1.68-3.25h2.84c-.15 1.18-.56 2.28-1.16 3.25z"
        />
      );
    case "football":
      return (
        <Path
          fill={color}
          d="M20.31 3.69C19.99 3.36 18.37 3 16.26 3c-3.03 0-7.09.75-9.8 3.46C1.87 11.05 2.9 19.52 3.69 20.31 4.01 20.64 5.63 21 7.74 21c3.03 0 7.09-.75 9.8-3.46 4.59-4.59 3.56-13.06 2.77-13.85zM7.74 19c-1.14 0-2.02-.12-2.53-.23-.18-.79-.3-2.21-.17-3.83l4.01 4.01C8.53 18.99 8.08 19 7.74 19zm8.39-2.87c-1.33 1.33-3.06 2.05-4.66 2.44l-6.04-6.04c.42-1.68 1.16-3.37 2.45-4.65 1.32-1.32 3.05-2.04 4.64-2.43l6.05 6.05c-.41 1.67-1.16 3.35-2.44 4.63zM18.96 9.09l-4.03-4.03C15.45 5.01 15.91 5 16.26 5c1.14 0 2.02.12 2.53.23.18.79.3 2.22.17 3.86z"
        />
      );
    case "hockey":
      return (
        <>
          <Path fill={color} d="M2 17v3h2v-4H3c-.55 0-1 .45-1 1z" />
          <Path fill={color} d="M9 16H5v4l4.69-.01c.38 0 .72-.21.89-.55l.87-1.9-1.59-3.48L9 16z" />
          <Path fill={color} d="M21.71 16.29C21.53 16.11 21.28 16 21 16h-1v4h2v-3c0-.28-.11-.53-.29-.71z" />
          <Path
            fill={color}
            d="M13.6 12.84 17.65 4H14.3l-1.76 3.97-.49 1.1L12 9.21 9.7 4H6.35l4.05 8.84 1.52 3.32L12 16.34l1.42 3.1c.17.34.51.55.89.55L19 20v-4h-4l-1.4-3.16z"
          />
        </>
      );
    case "rugby":
      return (
        <Path
          fill={color}
          d="M20.49 3.51c-.56-.56-2.15-.97-4.16-.97-3.08 0-7.15.96-9.98 3.79C1.66 11.03 2.1 19.07 3.51 20.49c.56.56 2.15.97 4.16.97 3.08 0 7.15-.96 9.98-3.79 4.69-4.69 4.25-12.73 2.84-14.16zM5.71 18.29c.63-1.89 2.16-4.99 4.87-7.7 2.68-2.68 5.78-4.23 7.7-4.88-.63 1.89-2.16 4.99-4.88 7.7-2.66 2.68-5.76 4.23-7.69 4.88zM7.76 7.76c2.64-2.64 6.34-3.12 8.03-3.19-2.05.94-4.46 2.46-6.61 4.61-2.16 2.16-3.67 4.58-4.61 6.63.07-2.48.85-5.74 3.19-8.05zm8.48 8.48c-2.64 2.64-6.34 3.12-8.03 3.19 2.05-.94 4.46-2.46 6.61-4.61 2.16-2.16 3.67-4.58 4.62-6.63-.1 2.49-.88 5.75-3.2 8.05z"
        />
      );
    case "mma":
      return (
        <>
          <Path fill={color} d="M7 20c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-3H7v3z" />
          <Path
            fill={color}
            d="M18 7c-.55 0-1 .45-1 1V5c0-1.1-.9-2-2-2H7C5.9 3 5 3.9 5 5v5.8c0 .13.01.26.04.39l.8 4c.09.47.5.8.98.8H17c.55 0 1.09-.44 1.2-.98l.77-3.83c.02-.12.03-.25.03-.38V8c0-.55-.45-1-1-1zm-1 3.6s-.64 3.4-.64 3.4H7.64S7 10.74 7 10.6V5h8v5h2v.6z"
          />
          <Rect x={8} y={7} width={6} height={3} fill={color} />
        </>
      );
    case "tennis":
      return (
        <>
          <Path
            fill={color}
            d="M19.52 2.49c-2.34-2.34-6.62-1.87-9.55 1.06-1.6 1.6-2.52 3.87-2.54 5.46-.02 1.58.26 3.89-1.35 5.5L1.84 18.75l1.42 1.42 4.24-4.24c1.61-1.61 3.92-1.33 5.5-1.35s3.86-.94 5.46-2.54c2.92-2.93 3.4-7.21 1.06-9.55zM10.32 11.68c-1.53-1.53-1.05-4.61 1.06-6.72s5.18-2.59 6.72-1.06c1.53 1.53 1.05 4.61-1.06 6.72s-5.19 2.59-6.72 1.06z"
          />
          <Path
            fill={color}
            d="M18 17c.53 0 1.04.21 1.41.59.78.78.78 2.05 0 2.83C19.04 20.79 18.53 21 18 21s-1.04-.21-1.41-.59c-.78-.78-.78-2.05 0-2.83C16.96 17.21 17.47 17 18 17m0-2c-1.02 0-2.05.39-2.83 1.17-1.56 1.56-1.56 4.09 0 5.66C15.95 22.61 16.98 23 18 23s2.05-.39 2.83-1.17c1.56-1.56 1.56-4.09 0-5.66C20.05 15.39 19.02 15 18 15z"
          />
        </>
      );
    case "golf":
      return (
        <>
          <Path
            fill={color}
            d="M12 16c3.87 0 7-3.13 7-7s-3.13-7-7-7-7 3.13-7 7 3.13 7 7 7zm0-12c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"
          />
          <Circle cx={10} cy={8} r={1} fill={color} />
          <Circle cx={14} cy={8} r={1} fill={color} />
          <Circle cx={12} cy={6} r={1} fill={color} />
          <Path fill={color} d="M7 19h2c1.1 0 2 .9 2 2v1h2v-1c0-1.1.9-2 2-2h2v-2H7v2z" />
        </>
      );
    case "esports":
      return (
        <Path
          fill={color}
          d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.55 0 2.74-1.37 2.53-2.91zM19.48 16.81c-.08.09-.21.19-.42.19-.15 0-.29-.06-.39-.16L15.83 14H8.17l-2.84 2.84c-.1.1-.24.16-.39.16-.21 0-.34-.1-.42-.19-.08-.09-.16-.23-.13-.44l1.09-7.66C5.63 7.74 6.48 7 7.47 7h9.06c.99 0 1.84.74 1.98 1.72l1.09 7.66c.04.21-.04.35-.12.43z"
        />
      );
    case "motorsports":
      return (
        <Path
          fill={color}
          d="M21.96 11.22C21.57 7.01 17.76 4 13.56 4c-.19 0-.38.01-.57.02C2 4.74 2 17.2 2 17.2V18c0 1.1.9 2 2 2h10c4.67 0 8.41-4.01 7.96-8.78zM5.26 11.56c.57-1.29 1.28-2.35 2.14-3.19l3.62 1.53c.6.25.98.83.98 1.48 0 .89-.72 1.61-1.61 1.61H4.72c.15-.46.32-.94.54-1.43zM18.44 16.04C17.3 17.29 15.68 18 14 18H4v-.8c0-.02.01-.92.24-2.2h6.15c1.99 0 3.61-1.62 3.61-3.61 0-1.45-.87-2.76-2.2-3.32L9.3 7.01c1.1-.57 2.37-.9 3.82-.99.15-.01.3-.02.44-.02 3.31 0 6.13 2.37 6.41 5.41.16 1.71-.38 3.35-1.53 4.63z"
        />
      );
    default:
      return null;
  }
}

export function MaterialOutlinedSportIcon({
  name,
  size = 24,
  color,
}: {
  name?: string | null;
  size?: number;
  color: string;
}) {
  const id = outlinedSportId(name ?? undefined);
  if (!id) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Glyph id={id} color={color} />
    </Svg>
  );
}

/** @deprecated Use MaterialOutlinedSportIcon name="baseball" */
export function MaterialSportsBaseballOutline({
  size = 24,
  color,
}: {
  size?: number;
  color: string;
}) {
  return <MaterialOutlinedSportIcon name="baseball" size={size} color={color} />;
}
