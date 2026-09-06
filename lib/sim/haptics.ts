import * as ExpoHaptics from "expo-haptics";

// Haptics are globally disabled. This shim mirrors the expo-haptics API surface
// the app uses (selectionAsync / impactAsync / notificationAsync + the two enum
// objects) but makes every trigger a no-op. Flip ENABLED to true to restore
// haptic feedback everywhere without touching call sites.
const ENABLED = false;

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export function selectionAsync(): Promise<void> {
  if (!ENABLED) return Promise.resolve();
  return ExpoHaptics.selectionAsync();
}

export function impactAsync(style?: ExpoHaptics.ImpactFeedbackStyle): Promise<void> {
  if (!ENABLED) return Promise.resolve();
  return ExpoHaptics.impactAsync(style);
}

export function notificationAsync(type?: ExpoHaptics.NotificationFeedbackType): Promise<void> {
  if (!ENABLED) return Promise.resolve();
  return ExpoHaptics.notificationAsync(type);
}
