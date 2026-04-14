'use client'

import { Popover } from '@base-ui/react/popover'
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { format, parse } from 'date-fns'
import { ko } from 'date-fns/locale/ko'
import { forwardRef, useCallback, useState, type ComponentPropsWithoutRef } from 'react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/cn'

interface DatePickerProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  formatDate?: (date: Date) => string
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const parsed = parse(iso, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function toISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function defaultFormatDate(date: Date): string {
  return format(date, 'yyyy년 M월 d일', { locale: ko })
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      placeholder = '날짜를 선택하세요',
      disabled,
      name,
      formatDate = defaultFormatDate,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')

    const currentValue = value !== undefined ? value : internalValue
    const selectedDate = toDate(currentValue)

    const handleSelect = useCallback(
      (date: Date | undefined) => {
        if (!date) return
        const iso = toISO(date)
        if (value === undefined) {
          setInternalValue(iso)
        }
        onValueChange?.(iso)
        setOpen(false)
      },
      [value, onValueChange],
    )

    const displayText = selectedDate ? formatDate(selectedDate) : undefined

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-foreground transition-[color,border-color] duration-[var(--transition-fast)]',
            'hover:border-border-hover',
            'focus:border-primary focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'cursor-pointer',
            !displayText && 'text-foreground-muted',
            className,
          )}
          {...props}
        >
          <CalendarBlank size={16} className="shrink-0 text-foreground-muted" />
          <span className="flex-1 truncate">{displayText ?? placeholder}</span>
        </Popover.Trigger>

        {name && <input type="hidden" name={name} value={currentValue} />}

        <Popover.Portal>
          <Popover.Positioner sideOffset={4}>
            <Popover.Popup
              className={cn(
                'z-50 rounded-lg border border-border bg-surface p-3 shadow-[var(--shadow-elevation-3)] outline-none',
                'will-change-transform',
                'transition-all duration-100 ease-out',
                'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              )}
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                defaultMonth={selectedDate}
                locale={ko}
                showOutsideDays
                fixedWeeks
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === 'left' ? (
                      <CaretLeft size={14} weight="bold" />
                    ) : (
                      <CaretRight size={14} weight="bold" />
                    ),
                }}
                classNames={{
                  root: 'text-foreground',
                  months: 'flex flex-col',
                  month: 'space-y-3',
                  month_caption: 'flex items-center justify-center',
                  caption_label: 'text-sm font-semibold text-foreground',
                  nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-1',
                  button_previous: cn(
                    'inline-flex size-8 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-[var(--transition-fast)]',
                    'hover:bg-muted hover:text-foreground',
                  ),
                  button_next: cn(
                    'inline-flex size-8 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-[var(--transition-fast)]',
                    'hover:bg-muted hover:text-foreground',
                  ),
                  weekdays: 'flex',
                  weekday: 'w-9 text-center text-xs font-medium text-foreground-muted',
                  week: 'flex',
                  weeks: 'space-y-0.5',
                  day: 'flex size-9 items-center justify-center rounded-lg text-sm transition-colors duration-[var(--transition-fast)]',
                  day_button: cn(
                    'flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors duration-[var(--transition-fast)]',
                    'hover:bg-muted',
                    'focus:ring-1 focus:ring-primary focus:outline-none',
                  ),
                  today: 'font-bold text-primary',
                  selected: 'bg-primary text-primary-foreground hover:bg-primary-hover',
                  outside: 'text-foreground-muted opacity-40',
                  disabled: 'opacity-30 cursor-not-allowed',
                  hidden: 'invisible',
                  month_grid: 'relative',
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    )
  },
)

DatePicker.displayName = 'DatePicker'
