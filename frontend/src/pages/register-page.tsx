import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { AppFooter } from '@/components/app-footer'
import { FullPageLoader } from '@/components/full-page-loader'
import { PasswordInput } from '@/components/password-input'
import { AppleIcon, GitHubIcon, GoogleIcon } from '@/components/social-icons'
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
import { useRegisterMutation } from '@/lib/auth/register'
import {
  registerSchema,
  type RegisterFormValues,
} from '@/lib/auth/register-schema'

export function RegisterPage() {
  const registerMutation = useRegisterMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, ...registerInput } = values
    registerMutation.mutate(registerInput)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {registerMutation.isPending && <FullPageLoader />}
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join Application Tracker to start tracking your applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registerMutation.isSuccess ? (
              <div className="flex flex-col gap-6">
                <Alert>
                  <AlertDescription>
                    Check your email to verify your account. We sent a link
                    to <strong>{registerMutation.data.email}</strong>.
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
              onSubmit={handleSubmit(onSubmit)}
            >
              {registerMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {registerMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" autoComplete="name" {...register('name')} />
                {errors.name && (
                  <span className="text-sm text-destructive">
                    {errors.name.message}
                  </span>
                )}
              </div>

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

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-sm text-destructive">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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

              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  or sign up with
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign up with Google"
                >
                  <GoogleIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign up with Apple"
                >
                  <AppleIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign up with GitHub"
                >
                  <GitHubIcon />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="underline underline-offset-4">
                  Sign In
                </Link>
              </p>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  )
}
