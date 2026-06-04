import type { Metadata } from 'next'
import { parseTeamSearchQuery } from 'opensoma/shared/utils/team-params'
import { Suspense } from 'react'

import { ReportCreateForm } from '@/app/(main)/report/new/components/report-create-form'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/client'
import { UserGb } from '@/lib/sdk'

import {
  buildRegularReportDefaults,
  EMPTY_REGULAR_REPORT_DEFAULTS,
  type RegularReportDefaults,
} from './lib/regular-report-defaults'

export const metadata: Metadata = {
  title: '보고서 등록',
}

export default async function ReportCreatePage() {
  const defaults = await loadRegularReportDefaults()

  return (
    <Suspense>
      <ReportCreateForm defaults={defaults} />
    </Suspense>
  )
}

async function loadRegularReportDefaults(): Promise<RegularReportDefaults> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return EMPTY_REGULAR_REPORT_DEFAULTS

  try {
    const client = await createClient()
    const search = parseTeamSearchQuery(currentUser.userGb === UserGb.Trainee ? 'member:@me' : 'mentor:@me')
    const teamInfo = await client.team.list({ search })
    return buildRegularReportDefaults(teamInfo.teams)
  } catch (error) {
    if (error instanceof Error) return EMPTY_REGULAR_REPORT_DEFAULTS
    throw error
  }
}
