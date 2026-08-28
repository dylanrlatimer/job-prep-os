'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placement?: 'top' | 'bottom';
  'aria-label'?: string;
};

export default function Select({
  value,
  onValueChange,
  options,
  className,
  placement = 'bottom',
  'aria-label': ariaLabel,
}: SelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const displayLabel = selectedOption?.label ?? '';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    listRef.current?.focus();
  }, [open, options, value]);

  const selectOption = (option: SelectOption) => {
    onValueChange(option.value);
    setOpen(false);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + options.length) % options.length);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) selectOption(option);
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type='button'
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'box-border flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors',
          'hover:border-tertiary-foreground focus:border-tertiary-foreground focus:outline-none',
          open && 'border-tertiary-foreground',
        )}>
        <span className='truncate'>{displayLabel}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          aria-hidden='true'
          className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role='listbox'
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className={cn(
            'absolute left-0 z-50 max-h-48 w-full overflow-y-auto rounded-sm border border-border bg-card py-1 shadow-none',
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value || '__empty__'}
                role='option'
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                  isHighlighted ? 'bg-card-muted text-foreground' : 'text-foreground',
                  isSelected && !isHighlighted && 'text-foreground',
                )}>
                <span className='truncate'>{option.label}</span>
                {isSelected ? <Check size={14} strokeWidth={1.75} aria-hidden='true' className='shrink-0 text-muted-foreground' /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
