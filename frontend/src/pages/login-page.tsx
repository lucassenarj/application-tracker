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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/lib/auth/login'
import { loginSchema, type LoginFormValues } from '@/lib/auth/login-schema'

export function LoginPage() {
  const loginMutation = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="flex min-h-screen flex-col">
      {loginMutation.isPending && <FullPageLoader />}
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
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue to Application Tracker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-6"
              noValidate
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
            >
              {loginMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginMutation.error.message}
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-sm text-destructive">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground/50">
                  <Checkbox disabled />
                  Remember me
                </label>
                <span className="cursor-not-allowed text-sm text-muted-foreground/50">
                  Forgot Password?
                </span>
              </div>

              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  'Logging in...'
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign in with Google"
                >
                  <GoogleIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign in with Apple"
                >
                  <AppleIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                  aria-label="Sign in with GitHub"
                >
                  <GitHubIcon />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="underline underline-offset-4">
                  Register
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
