import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProfileMutation } from '@/lib/auth/update-profile'
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/lib/auth/update-profile-schema'
import { userQueryOptions } from '@/lib/auth/user-query'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'

export function ProfilePage() {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const userQuery = useQuery(userQueryOptions)
  const statsQuery = useQuery(applicationStatsQueryOptions)
  const updateProfileMutation = useUpdateProfileMutation()
  const user = userQuery.data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      avatar: user?.avatar ?? '',
    },
  })

  const startEditing = () => {
    reset({ name: user?.name ?? '', avatar: user?.avatar ?? '' })
    setMode('edit')
  }

  const cancelEditing = () => {
    setMode('view')
  }

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateProfileMutation.mutate(
      {
        name: values.name || undefined,
        avatar: values.avatar || undefined,
      },
      {
        onSuccess: () => {
          setMode('view')
        },
      },
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-medium">Profile</h1>

      {mode === 'view' && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {updateProfileMutation.isSuccess && (
              <p className="text-sm text-muted-foreground">
                Profile updated.
              </p>
            )}

            <div className="flex items-center gap-4">
              <UserAvatar user={user} className="h-16 w-16 text-xl" />
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {user.name || 'No name set'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <span className="text-sm text-muted-foreground">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {statsQuery.isSuccess && (
              <span className="text-sm text-muted-foreground">
                {statsQuery.data.total} application
                {statsQuery.data.total === 1 ? '' : 's'} tracked
              </span>
            )}

            <Button onClick={startEditing} className="self-start">
              Edit
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === 'edit' && (
        <Card>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
            >
              {updateProfileMutation.isError && (
                <p className="text-sm text-destructive">
                  {updateProfileMutation.error.message}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input id="avatar" {...register('avatar')} />
                {errors.avatar && (
                  <span className="text-sm text-destructive">
                    {errors.avatar.message}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
