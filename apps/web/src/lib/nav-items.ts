import type { Icon } from '@phosphor-icons/react'
import { CalendarBlank, ChalkboardTeacher, House, Megaphone, Newspaper, Notebook, Users } from '@phosphor-icons/react'

import { buildMentoringUrl } from './mentoring-url'

export const navItems: Array<{ href: string; label: string; icon: Icon }> = [
  { href: '/', label: '대시보드', icon: House },
  { href: buildMentoringUrl({ search: 'author:@me' }), label: '멘토링/특강', icon: ChalkboardTeacher },
  { href: '/room', label: '회의실', icon: CalendarBlank },
  { href: '/report', label: '보고서', icon: Notebook },
  { href: '/team', label: '팀매칭', icon: Users },
  { href: '/notice', label: '공지사항', icon: Megaphone },
  { href: '/event', label: '행사', icon: Newspaper },
]
