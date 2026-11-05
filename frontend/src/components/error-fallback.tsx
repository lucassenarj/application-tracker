import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ErrorFallbackProps {
  resetError: () => void
}

export function ErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          An unexpected error occurred. You can try again, or reload the
          page if the problem continues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={resetError}>
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
