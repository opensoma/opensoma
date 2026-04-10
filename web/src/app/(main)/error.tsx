'use client'

import { WarningCircle } from '@phosphor-icons/react'

import { Button } from '~/ui/button'
import { Card, CardContent, CardHeader } from '~/ui/card'

export default function MainError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex flex-col items-center text-center gap-3">
            <WarningCircle size={48} weight="thin" className="text-danger" />
            <h1 className="text-xl font-semibold text-foreground">페이지를 불러오지 못했습니다.</h1>
            <p className="text-sm text-foreground-muted">잠시 후 다시 시도해주세요.</p>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset}>다시 시도</Button>
        </CardContent>
      </Card>
    </div>
  )
}
