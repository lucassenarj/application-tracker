import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { AppFooter } from '@/components/app-footer'
import { FullPageLoader } from '@/components/full-page-loader'
import { PasswordInput } from '@/components/password-input'
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
import { Label } from '@/components/ui/label'
import { useResetPasswordMutation } from '@/lib/auth/reset-password'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/lib/auth/reset-password-schema'

export function ResetPasswordPage() {
  const { token } = useSearch({ from: '/reset-password' })
  const resetPasswordMutation = useResetPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  return (
    <div className="flex min-h-screen flex-col">
      {resetPasswordMutation.isPending && <FullPageLoader />}
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
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            {resetPasswordMutation.isSuccess ? (
              <div className="flex flex-col gap-6">
                <Alert>
                  <AlertDescription>
                    Your password has been reset.
                  </AlertDescription>
                </Alert>
                <Button type="button" render={<Link to="/login" />}>
                  Sign In
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-6"
                noValidate
                onSubmit={handleSubmit((values) =>
                  resetPasswordMutation.mutate({
                    token: token ?? '',
                    newPassword: values.newPassword,
                  }),
                )}
              >
                {resetPasswordMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription className="flex flex-col gap-2">
                      {resetPasswordMutation.error.message}
                      <Link
                        to="/forgot-password"
                        className="underline underline-offset-4"
                      >
                        Request a new reset link
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    autoComplete="new-password"
                    {...register('newPassword')}
                  />
                  {errors.newPassword && (
                    <span className="text-sm text-destructive">
                      {errors.newPassword.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <span className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </div>

                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending
                    ? 'Resetting...'
                    : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  )
}
