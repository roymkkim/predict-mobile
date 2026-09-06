/** Shared DS TextField wiring for web (no inner browser outline/glow). */
export const TEXT_FIELD_INPUT_PROPS = {
  showSoftInputOnFocus: false as const,
  twClassName: "outline-none",
};

export function textFieldFocusClass(focused: boolean): string | undefined {
  return focused ? "border-primary-default" : undefined;
}
