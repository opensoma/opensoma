import { Button } from '~/ui/button'
import { Card, CardContent, CardHeader } from '~/ui/card'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex flex-col items-center text-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 256 256" className="text-foreground-muted" aria-hidden="true"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" d="M 168 168 L 228 228 M 112 184 A 72 72 0 1 0 112 40 A 72 72 0 1 0 112 184 Z" /></svg>
            <p className="text-sm font-medium text-primary">404 NOT FOUND</p>
            <h1 className="text-2xl font-bold text-foreground">페이지를 찾을 수 없습니다.</h1>
            <p className="text-sm text-foreground-muted">요청하신 페이지가 없거나 이동되었을 수 있습니다.</p>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <form action="/">
            <Button type="submit">홈으로 이동</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
