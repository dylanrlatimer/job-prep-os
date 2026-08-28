const inputClassName =
  'box-border w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:border-tertiary-foreground focus:outline-none';

const textareaClassName = `${inputClassName} min-h-32 resize-y leading-relaxed`;

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground no-underline transition-colors hover:bg-card-muted disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60';

export { inputClassName, textareaClassName, primaryButtonClassName, secondaryButtonClassName };
