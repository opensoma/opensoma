import { Warning } from '@phosphor-icons/react/dist/ssr'

export function SiteBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-warning/30 bg-warning-muted text-warning-foreground"
    >
      <div className="mx-auto flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium sm:text-sm">
        <Warning size={16} weight="fill" className="shrink-0" aria-hidden="true" />
        <span>
          현재 세션 쿠키가 불안정하여 예기치 않게 로그아웃될 수 있습니다. 불편을 드려 죄송하며, 빠르게 복구 중입니다.
        </span>
      </div>
    </div>
  )
}
