import type { Icon } from '@phosphor-icons/react'
import {
  CalendarBlank,
  ChalkboardTeacher,
  House,
  Megaphone,
  Newspaper,
  User,
  Users,
} from '@phosphor-icons/react'

export const navItems: Array<{ href: string; label: string; icon: Icon }> = [
  { href: '/dashboard', label: '대시보드', icon: House },
  { href: '/notice', label: '공지사항', icon: Megaphone },
  { href: '/mentoring', label: '멘토링 / 특강 게시판', icon: ChalkboardTeacher },
  { href: '/room', label: '회의실 예약', icon: CalendarBlank },
  { href: '/team', label: '팀매칭', icon: Users },
  { href: '/event', label: '행사 게시판', icon: Newspaper },
  { href: '/member', label: '회원정보', icon: User },
]
