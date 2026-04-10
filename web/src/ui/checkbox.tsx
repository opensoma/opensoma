'use client'

import { Check } from '@phosphor-icons/react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '~/lib/cn'

interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
  'children' | 'onCheckedChange'
> {
  children?: ReactNode
  onCheckedChange?: (checked: boolean) => void
  labelClassName?: string
}

export function Checkbox({ children, className, labelClassName, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm text-foreground', labelClassName)}>
      <BaseCheckbox.Root
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-lg border border-border transition-[color,border-color,background-color] duration-[var(--transition-fast)]',
          'data-[checked]:border-primary data-[checked]:border-[1px] data-[checked]:bg-primary',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
        onCheckedChange={(checked) => onCheckedChange?.(checked)}
        {...props}
      >
        <BaseCheckbox.Indicator className="text-primary-foreground">
          <Check size={10} weight="bold" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children ? <span>{children}</span> : null}
    </label>
  )
}


