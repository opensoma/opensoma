'use client'

import { Field } from '@base-ui/react/field'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

import { cn } from '~/lib/cn'

export interface InputProps extends ComponentPropsWithoutRef<typeof Field.Control> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <Field.Control
    ref={ref}
    className={cn(
      'block h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-[color,border-color] duration-[var(--transition-fast)]',
      'placeholder:text-foreground-muted',
      'hover:border-border-hover',
      'focus:border-primary focus:outline-none',
      'data-[invalid]:border-danger',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
))

Input.displayName = 'Input'
