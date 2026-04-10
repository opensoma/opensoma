'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'

import { cn } from '~/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'block w-full min-h-[96px] resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-[color,border-color] duration-[var(--transition-fast)]',
      'placeholder:text-foreground-muted',
      'hover:border-border-hover',
      'focus:border-primary focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'
