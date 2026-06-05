import { type SomaCampus } from './campus'

let campusOverride: SomaCampus | undefined

export function setCampusOverride(campus: SomaCampus | undefined): void {
  campusOverride = campus
}

export function getCampusOverride(): SomaCampus | undefined {
  return campusOverride
}
