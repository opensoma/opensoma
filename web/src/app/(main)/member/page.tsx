import { requireAuth } from '~/lib/auth'
import { Card, CardContent, CardHeader } from '~/ui/card'

export default async function MemberPage() {
  const client = await requireAuth()
  const member = await client.member.show()

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">회원정보</h1>
          <p className="text-sm text-foreground-muted">마이페이지에 등록된 회원 정보를 확인하세요.</p>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <MemberItem label="아이디" value={member.email} />
          <MemberItem label="이름" value={member.name} />
          <MemberItem label="성별" value={member.gender || '-'} />
          <MemberItem label="생년월일" value={member.birthDate || '-'} />
          <MemberItem label="연락처" value={member.phone || '-'} />
          <MemberItem label="소속" value={member.organization || '-'} />
          <MemberItem label="직책" value={member.position || '-'} />
        </dl>
      </CardContent>
    </Card>
  )
}

function MemberItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
