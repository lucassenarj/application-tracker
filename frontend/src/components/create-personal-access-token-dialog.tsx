import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreatePersonalAccessTokenMutation } from '@/lib/auth/create-personal-access-token'
import {
  createPersonalAccessTokenSchema,
  type CreatePersonalAccessTokenFormValues,
} from '@/lib/auth/create-personal-access-token-schema'

const EXPIRATION_LABELS: Record<
  CreatePersonalAccessTokenFormValues['expirationOption'],
  string
> = {
  '1-week': '1 week',
  '1-month': '1 month',
  custom: 'Custom',
  never: 'Never',
}

export function CreatePersonalAccessTokenDialog() {
  const [open, setOpen] = useState(false)
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const createPersonalAccessTokenMutation = useCreatePersonalAccessTokenMutation()
  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePersonalAccessTokenFormValues>({
    resolver: zodResolver(createPersonalAccessTokenSchema),
    defaultValues: {
      label: '',
      expirationOption: 'never',
      customExpiresAt: '',
    },
  })

  const expirationOption = watch('expirationOption')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setRevealedToken(null)
      reset()
    }
  }

  const onSubmit = (values: CreatePersonalAccessTokenFormValues) => {
    createPersonalAccessTokenMutation.mutate(
      {
        label: values.label,
        expirationOption: values.expirationOption,
        customExpiresAt: values.customExpiresAt,
      },
      {
        onSuccess: (result) => {
          setRevealedToken(result.token)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>Add Token</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{revealedToken ? 'Token Created' : 'Add Token'}</DialogTitle>
        </DialogHeader>

        {revealedToken ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Copy this token now — you won't be able to see it again.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                aria-label="Personal access token"
                value={revealedToken}
              />
              <Button
                type="button"
                onClick={() => navigator.clipboard.writeText(revealedToken)}
              >
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            {createPersonalAccessTokenMutation.isError && (
              <p className="text-sm text-destructive">
                {createPersonalAccessTokenMutation.error.message}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" {...register('label')} />
              {errors.label && (
                <span className="text-sm text-destructive">
                  {errors.label.message}
                </span>
              )}
            </div>

            <Controller
              name="expirationOption"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Expiration">
                    <SelectValue placeholder="Select an expiration">
                      {(value: string | null) =>
                        value
                          ? EXPIRATION_LABELS[
                              value as CreatePersonalAccessTokenFormValues['expirationOption']
                            ]
                          : 'Select an expiration'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-week">1 week</SelectItem>
                    <SelectItem value="1-month">1 month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {expirationOption === 'custom' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="customExpiresAt">Expiration Date</Label>
                <Input
                  id="customExpiresAt"
                  type="date"
                  {...register('customExpiresAt')}
                />
                {errors.customExpiresAt && (
                  <span className="text-sm text-destructive">
                    {errors.customExpiresAt.message}
                  </span>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={createPersonalAccessTokenMutation.isPending}
              >
                {createPersonalAccessTokenMutation.isPending
                  ? 'Creating...'
                  : 'Create Token'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
