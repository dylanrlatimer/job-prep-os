<ins>22/04/2026</ins>

v1.0

# Primitives: Tailwind + CVA + CSS modules

React presentational building blocks: default classes + merged `className`, variants via CVA, heavy or verbose visuals in CSS modules instead of long utility strings.

# Tokens

Shared `--vars` in `:root`; point Tailwind theme at them and use the same vars in `.module.css` so colors/spacing don’t fork.

```css
:root {
  --color-accent: #0ea5e9;
  --radius-m: 10px;
}
```

# Primitive shape

One main element, forward ref, `cn(defaults, className)`.

```tsx
import * as React from 'react';
import { cn } from '@/lib/cn';

export const Eyebrow = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('m-0 text-sm font-medium uppercase tracking-wide text-accent', className)} {...props} />
));
Eyebrow.displayName = 'Eyebrow';
```

# `cn`

`clsx` + `tailwind-merge` so later classes win and conflicting utilities don’t pile up.

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

# Tailwind vs module (rule of thumb)

- **Utilities:** layout, spacing, short responsive tweaks, simple `focus-visible` / `hover`.
- **Module:** complex gradients, layered shadows, masks, `@keyframes`, `::before`/`::after`, third-party overrides (`:global(...)`), motion/query pairs that change layout (e.g. marquee off → horizontal scroll under `prefers-reduced-motion`).

CVA `base` often utilities (flex, radius, focus ring); variant classes can be module imports for gradient/button chrome.

# CVA + export `*Variants`

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import styles from './Button.module.css';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[length:var(--radius-m)] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  {
    variants: {
      variant: { primary: styles.primary, secondary: styles.secondary },
      size: { sm: 'px-4 py-2 text-sm', md: 'px-8 py-3 text-base' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
```

Same classes on `<a>` / router `Link` without duplicating strings:

```tsx
<a className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-full')} href='/pricing'>
  Pricing
</a>
```
