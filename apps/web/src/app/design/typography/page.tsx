'use client'

import { Card } from '@/ui/card'

export default function TypographyPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Typography</h1>
        <p className="mt-2 text-foreground-muted">Typography scale and font styles</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-2xl</span>
            <span className="text-2xl font-bold">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-xl</span>
            <span className="text-xl font-semibold">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-lg</span>
            <span className="text-lg font-medium">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-base</span>
            <span className="text-base">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-sm</span>
            <span className="text-sm">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-24 text-sm text-foreground-muted">text-xs</span>
            <span className="text-xs">다람쥐 헌 쳇바퀴에 타고파</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
