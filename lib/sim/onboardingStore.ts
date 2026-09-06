import { useSyncExternalStore } from "react";

// Global onboarding (identity-verification) flow state. The flow is mounted
// once at the app root (like BetSlipSheet) and raised from anywhere via
// requestOnboarding(). Mirrors the other sim module-level stores.
//
// - enabled: Settings "Onboarding flow" toggle (default OFF).
// - complete: set once the user finishes the whole flow ("Let's go"). While
//   false, every entry point re-triggers the flow; once true it never shows
//   again (until the setting is toggled off and back on, which re-arms it
//   so the demo can be replayed).
// - visible: whether the modal is currently presented.
// - variant: "multi" = the full step-per-field flow; "single" = intro ->
//   email -> code -> ONE combined info form (name/DOB/SSN) -> congrats.
export type OnboardingVariant = "multi" | "single";

export type OnboardingState = {
  enabled: boolean;
  complete: boolean;
  visible: boolean;
  variant: OnboardingVariant;
};

// Off by default: enable via the SettingsSheet "Onboarding flow" toggle to
// present the flow (toggling on raises it right away).
let current: OnboardingState = { enabled: false, complete: false, visible: false, variant: "multi" };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setOnboardingEnabled(enabled: boolean) {
  if (current.enabled === enabled) return;
  // Re-arming the toggle resets completion so the flow can be demoed again.
  // Turning it on re-arms completion AND raises the flow right away — the
  // onboarding is the first thing seen once the setting is on.
  current = { ...current, enabled, complete: enabled ? false : current.complete, visible: enabled };
  emit();
}

// Switching variants also re-arms completion so the new flow can be demoed.
export function setOnboardingVariant(variant: OnboardingVariant) {
  if (current.variant === variant) return;
  current = { ...current, variant, complete: false };
  emit();
}

// Returns true when the flow was raised (caller should NOT proceed with the
// gated action); false when onboarding is off/already done (proceed normally).
export function requestOnboarding(): boolean {
  // Only gate when the Settings toggle is on and the flow is unfinished.
  // Off (the default) is a no-op in every experience, including MM Proposal.
  if (!current.enabled || current.complete) return false;
  if (!current.visible) {
    current = { ...current, visible: true };
    emit();
  }
  return true;
}

// Dismiss without completing — next gated action re-triggers the flow.
export function closeOnboarding() {
  if (!current.visible) return;
  current = { ...current, visible: false };
  emit();
}

export function completeOnboarding() {
  current = { ...current, visible: false, complete: true };
  emit();
}

export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
