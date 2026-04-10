'use client'

import { Radio as BaseRadio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '~/lib/cn'

interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<typeof BaseRadioGroup>, 'children' | 'onValueChange'> {
  children: ReactNode
  onValueChange?: (value: string) => void
}

export function RadioGroup({ children, className, onValueChange, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cn('flex flex-wrap gap-4', className)}
      onValueChange={(value) => onValueChange?.(String(value))}
      {...props}
    >
      {children}
    </BaseRadioGroup>
  )
}

interface RadioItemProps extends Omit<ComponentPropsWithoutRef<typeof BaseRadio.Root>, 'children' | 'value'> {
  value: string
  children: ReactNode
  labelClassName?: string
}

export function RadioItem({ children, className, labelClassName, value, ...props }: RadioItemProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm text-foreground', labelClassName)}>
      <BaseRadio.Root
        value={value}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full border border-border transition-[color,border-color,background-color] duration-[var(--transition-fast)]',
          'data-[checked]:border-primary data-[checked]:border-[1px] data-[checked]:bg-primary',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
        {...props}
      >
        <BaseRadio.Indicator className="h-2 w-2 rounded-full bg-primary-foreground" />
      </BaseRadio.Root>
      <span>{children}</span>
    </label>
  )
}
