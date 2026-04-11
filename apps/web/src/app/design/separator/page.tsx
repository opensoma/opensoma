'use client'

import { Card } from '@/ui/card'
import { Separator } from '@/ui/separator'

export default function SeparatorPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Separator</h1>
        <p className="mt-2 text-foreground-muted">Visual divider between content sections</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Section A</h3>
            <p className="text-sm text-foreground-muted">
              This is the first section of content. Separators help visually distinguish different sections of a page or
              component.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Section B</h3>
            <p className="text-sm text-foreground-muted">
              This is the second section. The separator above creates a clear visual break between the two content
              areas.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Section C</h3>
            <p className="text-sm text-foreground-muted">
              You can use multiple separators to divide content into distinct visual groups.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
