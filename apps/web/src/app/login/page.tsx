'use client'

import { Lock, User } from '@phosphor-icons/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'

import { login } from '@/app/login/actions'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Field, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import { Separator } from '@/ui/separator'

const initialState = { error: '' }

const ERROR_MESSAGES: Record<string, string> = {
  'auth-recovery-failed': '자동 재로그인에 실패했습니다. 다시 로그인해주세요.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">오픈소마 로그인</h1>
        <Card className="shadow-[var(--shadow-elevation-2)]">
          <CardHeader className="pb-2">
            <p className="text-center text-sm text-foreground-muted">SW마에스트로 계정으로 로그인해주세요.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <Suspense fallback={<LoginForm queryError={null} />}>
              <LoginFormWithQueryError />
            </Suspense>

            <Separator className="my-6" />

            <p className="text-center text-xs text-foreground-muted">
              입력하신 계정 정보는 세션 자동 갱신을 위해 암호화되어 브라우저 쿠키에만 저장됩니다. 로그아웃 시 즉시
              삭제되며, 로그인 외 어떤 용도로도 사용되지 않습니다. 오픈소마의 전체 소스코드는{' '}
              <a
                href="https://github.com/opensoma/opensoma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              에서 확인하실 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoginFormWithQueryError() {
  const searchParams = useSearchParams()
  const queryError = ERROR_MESSAGES[searchParams.get('error') ?? ''] ?? null
  return <LoginForm queryError={queryError} />
}

function LoginForm({ queryError }: { queryError: string | null }) {
  const [state, formAction, isPending] = useActionState(login, initialState, '/login')
  const errorMessage = state.error || queryError || ''

  return (
    <form action={formAction} className="space-y-4">
      <Field name="username">
        <FieldLabel>
          <span className="flex items-center gap-1.5">
            <User size={14} weight="bold" />
            이메일
          </span>
        </FieldLabel>
        <Input autoComplete="username" name="username" placeholder="이메일을 입력해주세요" type="email" />
      </Field>
      <Field name="password">
        <FieldLabel>
          <span className="flex items-center gap-1.5">
            <Lock size={14} weight="bold" />
            비밀번호
          </span>
        </FieldLabel>
        <Input autoComplete="current-password" name="password" placeholder="비밀번호를 입력해주세요" type="password" />
      </Field>
      {errorMessage ? (
        <div className="rounded-lg bg-danger-muted p-3 text-sm text-danger-foreground">{errorMessage}</div>
      ) : null}
      <Button className="h-11 w-full" disabled={isPending} type="submit">
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
