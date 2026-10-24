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
import { useRegisterMutation } from '@/lib/auth/register'
import {
  registerSchema,
  type RegisterFormValues,
} from '@/lib/auth/register-schema'

export function RegisterPage() {
  const registerMutation = useRegisterMutation()
  const loginMutation = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const isPending = registerMutation.isPending || loginMutation.isPending
  const error = registerMutation.error ?? loginMutation.error

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => loginMutation.mutate(values),
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {isPending && <FullPageLoader />}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md [--card-spacing:--spacing(10)]">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <BrandMark size={70} />
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join Application Tracker to start tracking your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
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
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <span className="text-sm text-destructive">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Register'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline underline-offset-4">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
