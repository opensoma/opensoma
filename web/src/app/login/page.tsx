'use client'

import { useActionState } from 'react'

import { login } from '~/app/login/actions'
import { Button } from '~/ui/button'
import { Card, CardContent, CardHeader } from '~/ui/card'
import { Field, FieldLabel } from '~/ui/field'
import { Input } from '~/ui/input'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">SW마에스트로</h1>
        <Card className="shadow-[var(--shadow-elevation-2)]">
          <CardHeader>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">로그인</h2>
              <p className="text-sm text-foreground-muted">마이페이지 계정으로 로그인해주세요.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <Field name="username">
                <FieldLabel>아이디</FieldLabel>
                <Input autoComplete="username" name="username" placeholder="이메일을 입력해주세요" type="email" />
              </Field>
              <Field name="password">
                <FieldLabel>비밀번호</FieldLabel>
                <Input
                  autoComplete="current-password"
                  name="password"
                  placeholder="비밀번호를 입력해주세요"
                  type="password"
                />
              </Field>
              {state.error ? (
                <div className="rounded-lg bg-danger-muted p-3 text-sm text-danger-foreground">{state.error}</div>
              ) : null}
              <Button className="h-11 w-full" disabled={isPending} type="submit">
                {isPending ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
