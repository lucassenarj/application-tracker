import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { PasswordInput } from '@/components/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { useChangePasswordMutation } from '@/lib/auth/change-password'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/lib/auth/change-password-schema'

export function SecurityPage() {
  const changePasswordMutation = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      revokeOtherSessions: false,
    },
  })

  return (
    <div className="flex flex-col gap-[30px]">
      <PageHeader title="Security" />

      <Card>
        <form
          noValidate
          onSubmit={handleSubmit((values) => {
            const { confirmPassword, ...changePasswordInput } = values
            changePasswordMutation.mutate(changePasswordInput, {
              onSuccess: () => reset(),
            })
          })}
        >
          <CardContent className="flex flex-col gap-6">
            <h2 className="text-lg font-heading font-semibold">Change Password</h2>

            {changePasswordMutation.isSuccess && (
              <Alert>
                <AlertDescription>
                  Your password has been updated.
                </AlertDescription>
              </Alert>
            )}

            {changePasswordMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {changePasswordMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  {...register('currentPassword')}
                />
                {errors.currentPassword && (
                  <span className="text-sm text-destructive">
                    {errors.currentPassword.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Enter new password"
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
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <span className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Controller
                name="revokeOtherSessions"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              Log out of all other sessions
            </label>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending
                ? 'Updating...'
                : 'Update Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
