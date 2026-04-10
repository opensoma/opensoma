import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '~/lib/cn'

const variants = {
  primary: 'bg-primary text-primary-foreground border border-transparent hover:bg-primary-hover cursor-pointer',
  secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary-hover hover:border-border-hover cursor-pointer',
  ghost: 'text-foreground-muted border border-transparent hover:bg-muted cursor-pointer',
  danger: 'bg-danger text-white border border-transparent hover:bg-danger-hover cursor-pointer',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-sm h-9',
  md: 'px-3 py-2 text-sm h-11',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-[color,background-color,border-color] duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
