const inputClassName =
  'box-border w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:border-tertiary-foreground focus:outline-none';

const textareaClassName = `${inputClassName} min-h-32 resize-y leading-relaxed`;

const readOnlyInputClassName = 'box-border w-full rounded-sm border border-border-subtle bg-muted px-3 py-2 text-sm text-muted-foreground';

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground no-underline transition-colors hover:bg-card-muted disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60';

const destructiveButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-destructive-border bg-destructive-subtle px-3 py-2 text-sm text-destructive-bright no-underline transition-colors hover:bg-destructive-subtle/80 disabled:cursor-not-allowed disabled:opacity-60';

const destructiveSolidButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-destructive-button-border bg-destructive-button px-3 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-destructive-button-hover disabled:cursor-not-allowed disabled:opacity-60';

export {
  inputClassName,
  textareaClassName,
  readOnlyInputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  destructiveButtonClassName,
  destructiveSolidButtonClassName,
};
