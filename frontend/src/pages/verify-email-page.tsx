import { Link, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { AppFooter } from '@/components/app-footer'
import { FullPageLoader } from '@/components/full-page-loader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useVerifyEmailMutation } from '@/lib/auth/verify-email'

export function VerifyEmailPage() {
  const { token } = useSearch({ from: '/verify-email' })
  const verifyEmailMutation = useVerifyEmailMutation()
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current) {
      return
    }
    hasSubmitted.current = true
    verifyEmailMutation.mutate({ token: token ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (verifyEmailMutation.isPending || verifyEmailMutation.isIdle) {
    return <FullPageLoader />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md [--card-spacing:--spacing(10)]">
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <img
              src="/logo.png"
              alt="Application Tracker"
              className="h-auto w-[220px] max-w-full"
            />
            <CardTitle className="text-2xl">Verify Email</CardTitle>
            <CardDescription>
              Confirming your email verification link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifyEmailMutation.isSuccess ? (
              <div className="flex flex-col gap-6">
                <Alert>
                  <AlertDescription>
                    Your email has been verified.
                  </AlertDescription>
                </Alert>
                <Button type="button" render={<Link to="/login" />}>
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <Alert variant="destructive">
                  <AlertDescription className="flex flex-col gap-2">
                    {verifyEmailMutation.error?.message}
                    <Link
                      to="/register"
                      className="underline underline-offset-4"
                    >
                      Register again
                    </Link>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  )
}
