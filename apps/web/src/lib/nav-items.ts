import type { Icon } from '@phosphor-icons/react'
import {
  CalendarBlank,
  CalendarDots,
  ChalkboardTeacher,
  House,
  Megaphone,
  Notebook,
  Users,
} from '@phosphor-icons/react'

import { buildMentoringUrl } from './mentoring-url'

export type NavItem = { href: string; label: string; icon: Icon }

export function createNavItems({ isTrainee }: { isTrainee: boolean }): NavItem[] {
  return [
    { href: '/dashboard', label: '대시보드', icon: House },
    {
      href: isTrainee ? '/mentoring' : buildMentoringUrl({ search: 'author:@me' }),
      label: '멘토링/특강',
      icon: ChalkboardTeacher,
    },
    { href: '/room', label: '회의실', icon: CalendarBlank },
    { href: '/report', label: '보고서', icon: Notebook },
    { href: '/team', label: '팀매칭', icon: Users },
    { href: '/notice', label: '공지사항', icon: Megaphone },
    { href: '/schedule', label: '월간일정', icon: CalendarDots },
  ]
}
