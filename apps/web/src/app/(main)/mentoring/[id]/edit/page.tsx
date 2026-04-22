import { notFound } from 'next/navigation'

import { MentoringEditForm } from '@/app/(main)/mentoring/[id]/edit/components/mentoring-edit-form'
import { requireAuth } from '@/lib/auth'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MentoringEditPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const mentoringId = Number(id)

  if (Number.isNaN(mentoringId)) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const includeCancelled = getFirstValue(resolvedSearchParams.includeCancelled) === 'true'

  const client = await requireAuth()
  const today = new Date().toISOString().slice(0, 10)
  const yearEnd = `${today.slice(0, 4)}-12-31`
  const [mentoring, initialRooms, reservations, cancelledProbe] = await Promise.all([
    client.mentoring.get(mentoringId),
    client.room.list({ date: today }),
    client.room.reservations({
      startDate: today,
      endDate: yearEnd,
      status: includeCancelled ? 'all' : 'confirmed',
    }),
    includeCancelled
      ? Promise.resolve(null)
      : client.room.reservations({ startDate: today, endDate: yearEnd, status: 'cancelled' }),
  ])
  const existingReservations = reservations.items
  const hasCancelledReservations = includeCancelled
    ? existingReservations.some((r) => r.status === 'cancelled')
    : (cancelledProbe?.pagination.total ?? 0) > 0

  return (
    <MentoringEditForm
      mentoring={mentoring}
      initialRooms={initialRooms}
      existingReservations={existingReservations}
      hasCancelledReservations={hasCancelledReservations}
      includeCancelled={includeCancelled}
    />
  )
}

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
