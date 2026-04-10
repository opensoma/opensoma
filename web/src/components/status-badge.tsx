import { Badge } from '~/ui/badge'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={resolveVariant(status)} className="font-semibold">{status}</Badge>
}

function resolveVariant(status: string) {
  if (status === '접수중' || status === '신청완료') {
    return 'primary'
  }

  if (status === '마감') {
    return 'default'
  }

  if (status === '예약완료' || status === '승인완료' || status === 'OK') {
    return 'success'
  }

  if (status.includes('대기')) {
    return 'warning'
  }

  if (status.includes('취소')) {
    return 'danger'
  }

  return 'info'
}
