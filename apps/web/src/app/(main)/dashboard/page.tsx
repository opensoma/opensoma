import { Icon } from '@phosphor-icons/react'
import { Buildings, CalendarBlank, ChalkboardTeacher, Clock, MapPin, Users } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

import { StatusBadge } from '@/components/status-badge'
import { requireAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'
import { buildMentoringUrl } from '@/lib/mentoring-url'
import { convertSwmaestroUrl } from '@/lib/swmaestro-url'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import Link from '@/ui/link'

export const metadata: Metadata = {
  title: '대시보드',
}

type DashboardMentoringItem = {
  title: string
  url: string
  status: string
  date?: string
  time?: string
  timeEnd?: string
  venue?: string
  type?: '자유 멘토링' | '멘토 특강'
}

type DashboardMentoringCardProps = {
  items: DashboardMentoringItem[]
  title: string
  icon: Icon
}

export default async function DashboardPage() {
  const client = await requireAuth()
  const dashboard = await client.dashboard.get()
  const isTrainee = dashboard.role.includes('연수생')
  const publicMentoringItems = dashboard.mentoringSessions.filter((item) => item.type === '자유 멘토링')
  const lectureMentoringItems = dashboard.mentoringSessions.filter((item) => item.type === '멘토 특강')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-sm text-foreground-muted">마이페이지 주요 정보를 한눈에 확인하세요.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UserInfoCard name={dashboard.name} role={dashboard.role} position={dashboard.position} />
        <TeamInfoCard team={dashboard.team} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {isTrainee ? (
          <>
            <TraineeMentoringCard items={publicMentoringItems} title="자유 멘토링" icon={ChalkboardTeacher} />
            <TraineeMentoringCard items={lectureMentoringItems} title="멘토 특강" icon={ChalkboardTeacher} />
          </>
        ) : (
          <>
            <MentorMentoringCard
              items={publicMentoringItems}
              title="자유 멘토링"
              icon={ChalkboardTeacher}
              typeFilter="public"
            />
            <MentorMentoringCard
              items={lectureMentoringItems}
              title="멘토 특강"
              icon={ChalkboardTeacher}
              typeFilter="lecture"
            />
          </>
        )}
      </div>

      <RoomReservationCard items={dashboard.roomReservations} />
    </div>
  )
}

function UserInfoCard({ name, role, position }: { name: string; role: string; position: string }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users size={20} weight="bold" className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">사용자 정보</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <span className="text-xl font-bold text-primary">{name.charAt(0)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-foreground">{name}</div>
              <Badge variant="primary">{role}</Badge>
              {position && <span className="text-sm text-foreground-muted">· {position}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamInfoCard({ team }: { team?: { name: string; members: string; mentor: string } }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Buildings size={20} weight="bold" className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">팀 정보</h2>
        </div>
      </CardHeader>
      <CardContent>
        {team ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">팀명</span>
              <span className="font-semibold text-foreground">{team.name}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-sm text-foreground-muted">멘토</span>
              <div className="flex flex-wrap justify-end gap-2">
                {team.mentor.split(',').map((mentor) => {
                  const trimmed = mentor.trim()
                  return (
                    <Badge key={trimmed} variant="default">
                      {trimmed}
                    </Badge>
                  )
                })}
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-sm text-foreground-muted">팀원</span>
              <div className="flex flex-wrap justify-end gap-2">
                {team.members.split(',').map((member) => {
                  const trimmed = member.trim()
                  return (
                    <Badge key={trimmed} variant="default">
                      {trimmed}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={Users} message="현재 배정된 팀 정보가 없습니다." className="border-0 py-8" />
        )}
      </CardContent>
    </Card>
  )
}

function MentorMentoringCard({
  items,
  title,
  icon,
  typeFilter,
}: DashboardMentoringCardProps & { typeFilter?: string }) {
  return (
    <DashboardMentoringCard
      items={items}
      title={title}
      icon={icon}
      listHref={buildMentoringUrl({ type: typeFilter, search: 'author:@me' })}
      emptyMessage={`등록한 ${title}이 없습니다.`}
      totalHours={calculateMonthlyHours(items)}
    />
  )
}

function TraineeMentoringCard({ items, title, icon }: DashboardMentoringCardProps) {
  return (
    <DashboardMentoringCard
      items={items}
      title={title}
      icon={icon}
      listHref="/mentoring/history"
      emptyMessage={`신청한 ${title}이 없습니다.`}
    />
  )
}

function DashboardMentoringCard({
  items,
  title,
  icon: Icon,
  listHref,
  emptyMessage,
  totalHours,
}: DashboardMentoringCardProps & {
  listHref: string
  emptyMessage: string
  totalHours?: number
}) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={20} weight="bold" className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {totalHours !== undefined && totalHours > 0 && (
              <span className="text-sm text-foreground-muted">({totalHours}시간)</span>
            )}
          </div>
          <Link href={listHref} className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={Icon} message={emptyMessage} className="border-0 py-8" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isPast = item.date ? item.date < today : false
              return (
                <div
                  key={`${item.url}-${item.title}`}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border p-4 transition-colors',
                    isPast
                      ? 'border-border-muted bg-muted/20 opacity-60'
                      : 'border-border bg-muted/30 hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.date ? (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-sm font-medium',
                            isPast ? 'text-foreground-muted' : 'text-primary',
                          )}
                        >
                          <CalendarBlank size={14} />
                          <span>{item.date}</span>
                        </div>
                      ) : null}
                      {item.time ? (
                        <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
                          <Clock size={14} />
                          <span>{item.timeEnd ? `${item.time} ~ ${item.timeEnd}` : item.time}</span>
                        </div>
                      ) : null}
                      {item.venue ? (
                        <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
                          <MapPin size={14} />
                          <span>{item.venue}</span>
                        </div>
                      ) : null}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <Link
                    href={convertSwmaestroUrl(item.url)}
                    className={cn(
                      'font-medium hover:text-primary',
                      isPast ? 'text-foreground-muted' : 'text-foreground',
                    )}
                  >
                    {item.title}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RoomReservationCard({ items }: { items: Array<{ title: string; url: string; status: string }> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarBlank size={20} weight="bold" className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">회의실 예약</h2>
          </div>
          <Link href="/room" className="text-sm text-primary hover:underline">
            예약하기
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={CalendarBlank} message="예약한 회의실이 없습니다." className="border-0 py-8" />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={`${item.url}-${item.title}`}
                className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-4 transition-colors duration-150 hover:bg-surface-hover"
              >
                <Link
                  href={convertSwmaestroUrl(item.url)}
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {item.title}
                </Link>
                <Badge variant={item.status.includes('완료') ? 'success' : 'primary'}>{item.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function calculateMonthlyHours(items: DashboardMentoringItem[]): number {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return items.reduce((sum, item) => {
    if (!item.time || !item.timeEnd) return sum
    if (!item.date?.startsWith(currentMonth)) return sum
    const start = parseTime(item.time)
    const end = parseTime(item.timeEnd)
    return sum + (end - start)
  }, 0)
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + (minutes || 0) / 60
}
