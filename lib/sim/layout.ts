import { Platform } from "react-native";

// iPhone 14/15/16 logical size used by the web phone frame. Dynamic Island
// + status bar is 59pt; the home indicator is 34pt. Web has no native safe
// area, so these values are provided to SafeAreaProvider.
export const WEB_DYNAMIC_HEADER_HEIGHT = 59;
export const WEB_HOME_INDICATOR_HEIGHT = 34;
export const WEB_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: {
    top: WEB_DYNAMIC_HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: WEB_HOME_INDICATOR_HEIGHT,
  },
};

export const FEED_SECTION_GAP = 32;
/** Space between a page header (title / filters / tabs) and the scrolling body. */
export const PAGE_BODY_TOP_PADDING = 16;

export function screenTopInset(nativeInset: number): number {
  if (Platform.OS === "web") {
    return Math.max(nativeInset, WEB_DYNAMIC_HEADER_HEIGHT);
  }
  return nativeInset;
}
