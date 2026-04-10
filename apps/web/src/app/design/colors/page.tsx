'use client'

import { Card } from '@/ui/card'

function ColorSwatch({ name, variable }: { name: string; variable: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-12 w-12 rounded-lg border border-border" style={{ backgroundColor: `var(${variable})` }} />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">{name}</span>
        <span className="text-[10px] text-foreground-muted">{variable}</span>
      </div>
    </div>
  )
}

export default function ColorsPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Colors</h1>
        <p className="mt-2 text-foreground-muted">Color palette and semantic color tokens</p>
      </div>

      <Card className="p-6">
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground-muted">Brand</h3>
            <div className="flex flex-wrap gap-6">
              <ColorSwatch name="primary" variable="--color-primary" />
              <ColorSwatch name="primary-hover" variable="--color-primary-hover" />
              <ColorSwatch name="primary-light" variable="--color-primary-light" />
              <ColorSwatch name="primary-foreground" variable="--color-primary-foreground" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground-muted">Neutral</h3>
            <div className="flex flex-wrap gap-6">
              <ColorSwatch name="background" variable="--color-background" />
              <ColorSwatch name="foreground" variable="--color-foreground" />
              <ColorSwatch name="foreground-muted" variable="--color-foreground-muted" />
              <ColorSwatch name="surface" variable="--color-surface" />
              <ColorSwatch name="surface-hover" variable="--color-surface-hover" />
              <ColorSwatch name="muted" variable="--color-muted" />
              <ColorSwatch name="border" variable="--color-border" />
              <ColorSwatch name="border-muted" variable="--color-border-muted" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground-muted">Status</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="success" variable="--color-success" />
                <ColorSwatch name="success-muted" variable="--color-success-muted" />
                <ColorSwatch name="success-foreground" variable="--color-success-foreground" />
              </div>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="danger" variable="--color-danger" />
                <ColorSwatch name="danger-muted" variable="--color-danger-muted" />
                <ColorSwatch name="danger-foreground" variable="--color-danger-foreground" />
              </div>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="warning" variable="--color-warning" />
                <ColorSwatch name="warning-muted" variable="--color-warning-muted" />
                <ColorSwatch name="warning-foreground" variable="--color-warning-foreground" />
              </div>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="info" variable="--color-info" />
                <ColorSwatch name="info-muted" variable="--color-info-muted" />
                <ColorSwatch name="info-foreground" variable="--color-info-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
