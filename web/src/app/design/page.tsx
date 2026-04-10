'use client'

import * as React from 'react'

import { ChalkboardTeacher, Monitor, Moon, Sun } from '@phosphor-icons/react'

import { Breadcrumb } from '~/components/breadcrumb'
import { useTheme } from '~/lib/theme'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import { Card, CardHeader, CardContent } from '~/ui/card'
import { Checkbox } from '~/ui/checkbox'
import { EmptyState } from '~/ui/empty-state'
import { Field, FieldLabel, FieldDescription } from '~/ui/field'
import { Input } from '~/ui/input'
import { RadioGroup, RadioItem } from '~/ui/radio-group'
import { Select, SelectTrigger, SelectPopup, SelectItem } from '~/ui/select'
import { Separator } from '~/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '~/ui/table'
import { Textarea } from '~/ui/textarea'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </Card>
  )
}

function ColorSwatch({ name, variable }: { name: string; variable: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 w-12 rounded-lg border border-border"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">{name}</span>
        <span className="text-[10px] text-foreground-muted">{variable}</span>
      </div>
    </div>
  )
}

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System</h1>
          <p className="mt-2 text-foreground-muted">SW마에스트로 디자인 시스템</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg px-3 py-1 text-sm transition-colors cursor-pointer ${
                  theme === t ? 'bg-surface text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {t === 'light' ? <><Sun size={14} className="mr-1 inline" /> Light</> : t === 'dark' ? <><Moon size={14} className="mr-1 inline" /> Dark</> : <><Monitor size={14} className="mr-1 inline" /> System</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Section title="Colors">
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
      </Section>

      <Section title="Typography">
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
      </Section>

      <Section title="Buttons">
        <div className="space-y-6">
          <p className="text-sm text-foreground-muted">
            All buttons include an <code className="rounded bg-muted px-1.5 py-0.5 text-xs">active:scale-[0.98]</code> press effect for tactile feedback.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="md">
              Primary
            </Button>
            <Button variant="secondary" size="md">
              Secondary
            </Button>
            <Button variant="ghost" size="md">
              Ghost
            </Button>
            <Button variant="danger" size="md">
              Danger
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" disabled>
              Disabled Primary
            </Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">접수중</Badge>
          <Badge variant="success">예약완료</Badge>
          <Badge variant="danger">취소</Badge>
          <Badge variant="warning">대기</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Card Title</h3>
              <p className="text-sm text-foreground-muted">Card description goes here.</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This is the card content. It can contain any elements.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tables">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">홍길동</TableCell>
                <TableCell>멘토</TableCell>
                <TableCell>
                  <Badge variant="success">활성</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">김철수</TableCell>
                <TableCell>연수생</TableCell>
                <TableCell>
                  <Badge variant="warning">대기</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">이영희</TableCell>
                <TableCell>연수생</TableCell>
                <TableCell>
                  <Badge variant="danger">비활성</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <Field name="email">
              <FieldLabel>이메일</FieldLabel>
              <Input placeholder="user@example.com" />
              <FieldDescription>로그인에 사용할 이메일을 입력하세요.</FieldDescription>
            </Field>

            <Field name="bio">
              <FieldLabel>자기소개</FieldLabel>
              <Textarea placeholder="간단한 자기소개를 입력하세요." rows={4} />
            </Field>
          </div>

          <div className="space-y-6">
            <Field name="role">
              <FieldLabel>역할 선택</FieldLabel>
              <RadioGroup defaultValue="mentee">
                <RadioItem value="mentee">연수생</RadioItem>
                <RadioItem value="mentor">멘토</RadioItem>
                <RadioItem value="admin">관리자</RadioItem>
              </RadioGroup>
            </Field>

            <Field name="terms">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" />
                <FieldLabel htmlFor="terms" className="mb-0">
                  이용약관에 동의합니다
                </FieldLabel>
              </div>
            </Field>

            <Field name="status">
              <FieldLabel>상태 선택</FieldLabel>
              <Select defaultValue="active">
                <SelectTrigger placeholder="상태를 선택하세요" />
                <SelectPopup>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                </SelectPopup>
              </Select>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Empty State & Separator">
        <div className="space-y-8">
          <EmptyState message="데이터가 없습니다. 아직 등록된 항목이 없습니다. 새로운 항목을 추가해보세요." />

          <div>
            <p className="mb-4 text-sm text-foreground-muted">위아래 콘텐츠를 구분하는 구분선입니다.</p>
            <Separator />
            <p className="mt-4 text-sm text-foreground-muted">구분선 아래 콘텐츠입니다.</p>
          </div>
        </div>
      </Section>

      <Section title="Shadow Elevation">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-surface p-6 shadow-[var(--shadow-elevation-1)]">
            <p className="text-sm font-medium">Elevation 1</p>
            <p className="text-xs text-foreground-muted">Cards at rest</p>
          </div>
          <div className="rounded-lg bg-surface p-6 shadow-[var(--shadow-elevation-2)]">
            <p className="text-sm font-medium">Elevation 2</p>
            <p className="text-xs text-foreground-muted">Hover / raised</p>
          </div>
          <div className="rounded-lg bg-surface p-6 shadow-[var(--shadow-elevation-3)]">
            <p className="text-sm font-medium">Elevation 3</p>
            <p className="text-xs text-foreground-muted">Overlays / dropdowns</p>
          </div>
        </div>
      </Section>

      <Section title="Interactive Card">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Static Card</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-muted">No hover effect</p>
            </CardContent>
          </Card>
          <Card interactive>
            <CardHeader>
              <h3 className="text-lg font-semibold">Interactive Card</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-muted">Hover to see lift + shadow</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Empty States">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState message="데이터가 없습니다." />
          <EmptyState message="멘토링 세션이 없습니다." icon={ChalkboardTeacher} />
        </div>
      </Section>

      <Section title="Breadcrumb">
        <Breadcrumb
          items={[
            { label: '멘토링 / 특강 게시판', href: '/mentoring' },
            { label: '제목 예시' },
          ]}
        />
      </Section>

      <Section title="Slot Colors">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slot-selected-border bg-slot-selected px-3 py-2 text-sm text-slot-selected-foreground">
            Selected
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slot-available-border bg-slot-available px-3 py-2 text-sm text-slot-available-foreground">
            Available
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground-muted">
            Unavailable
          </div>
        </div>
      </Section>

      <Section title="Transitions">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium">Fast</p>
            <p className="text-xs text-foreground-muted">150ms — color, opacity</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium">Normal</p>
            <p className="text-xs text-foreground-muted">200ms — transform</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium">Slow</p>
            <p className="text-xs text-foreground-muted">300ms — layout shifts</p>
          </div>
        </div>
      </Section>
    </div>
  )
}
