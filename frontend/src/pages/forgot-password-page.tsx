import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPasswordMutation } from '@/lib/auth/forgot-password'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/auth/forgot-password-schema'

export function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  return (
    <div className="flex min-h-screen flex-col">
      {forgotPasswordMutation.isPending && <FullPageLoader />}
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
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-6"
              noValidate
              onSubmit={handleSubmit((values) =>
                forgotPasswordMutation.mutate(values),
              )}
            >
              {forgotPasswordMutation.isSuccess && (
                <Alert>
                  <AlertDescription>
                    If an account exists for that email, a reset link was
                    sent.
                  </AlertDescription>
                </Alert>
              )}

              {forgotPasswordMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {forgotPasswordMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-sm text-destructive">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <Button type="submit" disabled={forgotPasswordMutation.isPending}>
                {forgotPasswordMutation.isPending
                  ? 'Sending...'
                  : 'Send Reset Link'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link to="/login" className="underline underline-offset-4">
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  )
}
