import { MentoringCreateForm } from '@/app/(main)/mentoring/new/components/mentoring-create-form'
import { requireAuth } from '@/lib/auth'

export default async function MentoringCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const defaultValues = {
    date: getFirstValue(params.date),
    startTime: getFirstValue(params.startTime),
    endTime: getFirstValue(params.endTime),
    venue: getFirstValue(params.venue),
  }

  const initialDate = defaultValues.date ?? new Date().toISOString().slice(0, 10)
  const client = await requireAuth()
  const today = new Date().toISOString().slice(0, 10)
  const yearEnd = `${today.slice(0, 4)}-12-31`
  const [initialRooms, reservations] = await Promise.all([
    client.room.list({ date: initialDate, includeReservations: true }),
    client.room.reservations({ startDate: today, endDate: yearEnd }),
  ])
  const existingReservations = reservations.items

  return (
    <MentoringCreateForm
      defaultValues={defaultValues}
      initialDate={initialDate}
      initialRooms={initialRooms}
      existingReservations={existingReservations}
    />
  )
}

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
