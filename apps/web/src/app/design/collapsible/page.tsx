'use client'

import { Card } from '@/ui/card'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/ui/collapsible'

export default function CollapsiblePage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Collapsible</h1>
        <p className="mt-2 text-foreground-muted">Expandable and collapsible content sections</p>
      </div>

      <Card className="p-6">
        <div className="max-w-md space-y-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>What is your refund policy?</CollapsibleTrigger>
            <CollapsiblePanel>
              <p className="text-sm text-foreground-muted">
                We offer a 30-day money-back guarantee for all purchases. If you are not satisfied with your purchase,
                please contact our support team for assistance.
              </p>
            </CollapsiblePanel>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger>How do I track my order?</CollapsibleTrigger>
            <CollapsiblePanel>
              <p className="text-sm text-foreground-muted">
                Once your order ships, you will receive an email with a tracking number. You can use this number to
                track your package on our website or the carrier's site.
              </p>
            </CollapsiblePanel>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger>Do you offer international shipping?</CollapsibleTrigger>
            <CollapsiblePanel>
              <p className="text-sm text-foreground-muted">
                Yes, we ship to over 100 countries worldwide. Shipping rates and delivery times vary by location and
                will be calculated at checkout.
              </p>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </Card>
    </div>
  )
}
