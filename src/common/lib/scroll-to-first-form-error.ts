export function scrollToFirstFormError(
  fieldErrors: Record<string, string | undefined>,
  fieldOrder: readonly string[],
  root: ParentNode = document,
) {
  const firstField = fieldOrder.find((field) => Boolean(fieldErrors[field]));
  if (!firstField) return;

  const target =
    root.querySelector<HTMLElement>(`[data-field="${firstField}"]`) ?? root.querySelector<HTMLElement>(`#${firstField}`);

  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const focusable = target.matches('textarea, input, select')
    ? target
    : target.querySelector<HTMLElement>('textarea, input:not([type=checkbox]):not([type=radio]), select');

  focusable?.focus({ preventScroll: true });
}
