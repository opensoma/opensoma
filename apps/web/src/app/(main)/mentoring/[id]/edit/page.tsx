import { notFound } from 'next/navigation'

import { MentoringEditForm } from '@/app/(main)/mentoring/[id]/edit/components/mentoring-edit-form'
import { requireAuth } from '@/lib/auth'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MentoringEditPage({ params }: PageProps) {
  const { id } = await params
  const mentoringId = Number(id)

  if (Number.isNaN(mentoringId)) {
    notFound()
  }

  const client = await requireAuth()
  const today = new Date().toISOString().slice(0, 10)
  const yearEnd = `${today.slice(0, 4)}-12-31`
  const [mentoring, initialRooms, reservations] = await Promise.all([
    client.mentoring.get(mentoringId),
    client.room.list({ date: today }),
    client.room.reservations({ startDate: today, endDate: yearEnd }),
  ])

  return (
    <MentoringEditForm mentoring={mentoring} initialRooms={initialRooms} existingReservations={reservations.items} />
  )
}
