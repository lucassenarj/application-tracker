import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/user-avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProfileMutation } from '@/lib/auth/update-profile'
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/lib/auth/update-profile-schema'
import { userQueryOptions } from '@/lib/auth/user-query'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
] as const

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP'] as const

function languageLabel(value: string | null): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ??
    LANGUAGE_OPTIONS[0].label
  )
}

function splitName(name: string | undefined) {
  const [firstName = '', ...rest] = (name ?? '').trim().split(' ')
  return { firstName, lastName: rest.join(' ') }
}

export function ProfilePage() {
  const userQuery = useQuery(userQueryOptions)
  const statsQuery = useQuery(applicationStatsQueryOptions)
  const updateProfileMutation = useUpdateProfileMutation()
  const user = userQuery.data
  const [avatarFieldOpen, setAvatarFieldOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      avatar: '',
      phone: '',
      bio: '',
      language: LANGUAGE_OPTIONS[0].value,
      defaultCurrency: CURRENCY_OPTIONS[0],
    },
  })

  const userDefaults = (currentUser: typeof user) => ({
    ...splitName(currentUser?.name),
    avatar: currentUser?.avatar ?? '',
    phone: currentUser?.phone ?? '',
    bio: currentUser?.bio ?? '',
    language: currentUser?.language ?? LANGUAGE_OPTIONS[0].value,
    defaultCurrency: currentUser?.defaultCurrency ?? CURRENCY_OPTIONS[0],
  })

  useEffect(() => {
    if (user) {
      reset(userDefaults(user))
    }
  }, [user, reset])

  const onSubmit = (values: UpdateProfileFormValues) => {
    const name = [values.firstName, values.lastName].filter(Boolean).join(' ')
    updateProfileMutation.mutate({
      name: name || undefined,
      avatar: values.avatar || undefined,
      phone: values.phone || undefined,
      bio: values.bio || undefined,
      language: values.language || undefined,
      defaultCurrency: values.defaultCurrency || undefined,
    })
  }

  const cancel = () => {
    if (user) {
      reset(userDefaults(user))
    }
    setAvatarFieldOpen(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col gap-[30px]">
      <PageHeader title="Profile" />

      <Card>
        <CardContent className="flex flex-col gap-6">
          {updateProfileMutation.isSuccess && (
            <p className="text-sm text-muted-foreground">Profile updated.</p>
          )}
          {updateProfileMutation.isError && (
            <p className="text-sm text-destructive">
              {updateProfileMutation.error.message}
            </p>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar user={user} className="h-16 w-16 text-xl" />
              <button
                type="button"
                aria-label="Edit avatar"
                onClick={() => setAvatarFieldOpen((open) => !open)}
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{user.name || 'No name set'}</span>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              {statsQuery.isSuccess && (
                <span className="text-sm text-muted-foreground">
                  {statsQuery.data.total} application
                  {statsQuery.data.total === 1 ? '' : 's'} tracked
                </span>
              )}
            </div>
          </div>

          <form
            id="profile-form"
            className="flex flex-col gap-6"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email} disabled readOnly />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="text-sm text-destructive">
                    {errors.phone.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  {...register('bio')}
                />
                {errors.bio && (
                  <span className="text-sm text-destructive">
                    {errors.bio.message}
                  </span>
                )}
              </div>
              {avatarFieldOpen && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" autoFocus {...register('avatar')} />
                  {errors.avatar && (
                    <span className="text-sm text-destructive">
                      {errors.avatar.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Language</span>
                  <span className="text-sm text-muted-foreground">
                    Select your preferred language
                  </span>
                </div>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="language"
                        aria-label="Language"
                        className="w-auto min-w-[150px]"
                      >
                        <SelectValue>
                          {(value: string | null) => languageLabel(value)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Default Currency</span>
                  <span className="text-sm text-muted-foreground">
                    Used to pre-fill new applications
                  </span>
                </div>
                <Controller
                  name="defaultCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="defaultCurrency"
                        aria-label="Default Currency"
                        className="w-auto min-w-[150px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="profile-form"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={cancel}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
