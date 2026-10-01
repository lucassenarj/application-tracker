import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProfileMutation } from '@/lib/auth/update-profile'
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/lib/auth/update-profile-schema'
import { userQueryOptions } from '@/lib/auth/user-query'

export function ProfilePage() {
  const userQuery = useQuery(userQueryOptions)
  const updateProfileMutation = useUpdateProfileMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: userQuery.data?.name ?? '',
      avatar: userQuery.data?.avatar ?? '',
    },
  })

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateProfileMutation.mutate({
      name: values.name || undefined,
      avatar: values.avatar || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-heading font-medium">Profile</h1>

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

        {updateProfileMutation.isSuccess && (
          <p className="text-sm text-muted-foreground">Profile updated.</p>
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

        <Button type="submit" disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  )
}
