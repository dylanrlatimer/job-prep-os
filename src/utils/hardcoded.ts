/** Marks client-only copy for later i18n; returns the input unchanged. */
export function hardcoded<T extends string>(value: T): T {
  return value;
}
