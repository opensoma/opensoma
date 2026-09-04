import { findReportPlaceCd, getReportPlaces, type ReportPlace } from 'opensoma/constants'

export type { ReportPlace }

export type MenteeRegion = 'S' | 'B'

export function toMenteeRegion(value: string): MenteeRegion {
  return value === 'B' ? 'B' : 'S'
}

export function reportPlacesForRegion(menteeRegion: string): readonly ReportPlace[] {
  return getReportPlaces(toMenteeRegion(menteeRegion))
}

export function reportPlaceForRegion(cd: string, menteeRegion: string): string {
  const offered = reportPlacesForRegion(menteeRegion).some((place) => place.cd === cd)
  return offered ? cd : ''
}

export function reportPlaceCdFor(venue: string, menteeRegion: string): string {
  return findReportPlaceCd(venue, toMenteeRegion(menteeRegion)) ?? ''
}

export function locateReportPlace(venue: string): { menteeRegion: MenteeRegion; cd: string } | null {
  for (const menteeRegion of ['S', 'B'] as const) {
    const cd = findReportPlaceCd(venue, menteeRegion)
    if (cd) return { menteeRegion, cd }
  }

  return null
}
