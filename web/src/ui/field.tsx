'use client'

import { Field as BaseField } from '@base-ui/react/field'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '~/lib/cn'

interface FieldProps extends Omit<ComponentPropsWithoutRef<typeof BaseField.Root>, 'children'> {
  children: ReactNode
}

export function Field({ children, className, ...props }: FieldProps) {
  return (
    <BaseField.Root className={cn('space-y-1.5', className)} {...props}>
      {children}
    </BaseField.Root>
  )
}

interface FieldLabelProps extends Omit<ComponentPropsWithoutRef<typeof BaseField.Label>, 'children'> {
  children: ReactNode
}

export function FieldLabel({ children, className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label className={cn('block text-sm font-semibold text-foreground', className)} {...props}>
      {children}
    </BaseField.Label>
  )
}

interface FieldDescriptionProps extends Omit<ComponentPropsWithoutRef<typeof BaseField.Description>, 'children'> {
  children: ReactNode
}

export function FieldDescription({ children, className, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description className={cn('text-xs text-foreground-muted', className)} {...props}>
      {children}
    </BaseField.Description>
  )
}

interface FieldErrorProps extends Omit<ComponentPropsWithoutRef<typeof BaseField.Error>, 'children'> {
  children: ReactNode
}

export function FieldError({ children, className, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error className={cn('text-sm text-danger', className)} {...props}>
      {children}
    </BaseField.Error>
  )
}
