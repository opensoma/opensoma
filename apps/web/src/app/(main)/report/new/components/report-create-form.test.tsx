import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

let searchParams = new URLSearchParams()

function setSearchParams(init?: Record<string, string>): void {
  searchParams = new URLSearchParams(init)
}

mock.module('next/navigation', () => ({
  useSearchParams: () => searchParams,
}))

mock.module('@/app/(main)/report/new/actions', () => ({
  createReport: async () => ({ error: '' }),
}))

const { ReportCreateForm } = await import('./report-create-form')

function venueValue(container: HTMLElement): string {
  const input = container.querySelector<HTMLInputElement>('input[name="venue"]')
  return input?.value ?? '__no venue input__'
}

function regionRadio(label: string): HTMLElement {
  return screen.getByLabelText(label)
}

async function openPlaceSelect(): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByText('장소를 선택하세요'))
  })
}

describe('ReportCreateForm venue selection', () => {
  beforeEach(() => {
    setSearchParams()
  })

  it('keeps a prefilled Seoul place while the report stays on 서울', () => {
    setSearchParams({ venue: '스페이스 A1' })

    const { container } = render(<ReportCreateForm />)

    expect(venueValue(container)).toBe('스페이스 A1')
  })

  it('clears the selected place when the mentee region switches to 부산', async () => {
    setSearchParams({ venue: '스페이스 A1' })

    const { container } = render(<ReportCreateForm />)
    expect(venueValue(container)).toBe('스페이스 A1')

    fireEvent.click(regionRadio('부산'))

    await waitFor(() => {
      expect(venueValue(container)).toBe('')
    })
  })

  it('clears even a place the new region also has, since its code differs', async () => {
    setSearchParams({ venue: '온라인(Webex)' })

    const { container } = render(<ReportCreateForm />)

    fireEvent.click(regionRadio('부산'))

    await waitFor(() => {
      expect(venueValue(container)).toBe('')
    })
  })

  it('ignores a prefilled place the starting region does not offer', () => {
    setSearchParams({ menteeRegion: 'B', venue: '스페이스 A1' })

    const { container } = render(<ReportCreateForm />)

    expect(venueValue(container)).toBe('')
  })

  it('offers 서울 places until the region switches, then 부산 ones', async () => {
    render(<ReportCreateForm />)

    await openPlaceSelect()
    await screen.findByText('스페이스 A1')
    expect(screen.queryByText('SPACE A1')).toBeNull()

    fireEvent.click(regionRadio('부산'))
    await openPlaceSelect()

    await screen.findByText('SPACE A1')
    expect(screen.queryByText('스페이스 A1')).toBeNull()
  })

  it('starts on 부산 when the mentoring handoff says so', () => {
    setSearchParams({ menteeRegion: 'B', venue: 'CD_10' })

    const { container } = render(<ReportCreateForm />)

    expect(venueValue(container)).toBe('CD_10')
  })
})
