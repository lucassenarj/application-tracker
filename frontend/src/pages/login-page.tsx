import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
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
import { BrandMark } from '@/components/brand-mark'
import { FullPageLoader } from '@/components/full-page-loader'
import { PasswordInput } from '@/components/password-input'
import { ThemeToggle } from '@/components/theme-toggle'
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
    <div className="flex min-h-screen flex-col items-center justify-center">
      {loginMutation.isPending && <FullPageLoader />}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm [--card-spacing:--spacing(10)]">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <BrandMark size={70} />
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

            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>

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
  )
}
