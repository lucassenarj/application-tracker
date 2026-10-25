import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useChangeStatusMutation } from '@/lib/applications/change-status'
import {
  changeStatusSchema,
  type ChangeStatusFormValues,
} from '@/lib/applications/change-status-schema'
import type { ApplicationStatus } from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'

interface ChangeStatusDialogProps {
  applicationId: string
  availableTransitions: ApplicationStatus[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialStatus?: ApplicationStatus
  onSuccess?: () => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ChangeStatusDialog({
  applicationId,
  availableTransitions,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  initialStatus,
  onSuccess,
}: ChangeStatusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled
    ? onOpenChangeProp ?? (() => {})
    : setInternalOpen
  const changeStatusMutation = useChangeStatusMutation(applicationId)
  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeStatusFormValues>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: {
      status: initialStatus ?? '',
      eventDate: todayIso(),
      contactName: '',
      contactEmail: '',
      notes: '',
    },
  })

  const selectedStatus = watch('status')

  useEffect(() => {
    if (open) {
      reset({
        status: initialStatus ?? '',
        eventDate: todayIso(),
        contactName: '',
        contactEmail: '',
        notes: '',
      })
    }
  }, [open, initialStatus, reset])

  const onSubmit = (values: ChangeStatusFormValues) => {
    changeStatusMutation.mutate(
      {
        status: values.status,
        eventDate: values.eventDate,
        interviewCategory: values.interviewCategory || undefined,
        contactName: values.contactName || undefined,
        contactEmail: values.contactEmail || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          reset()
          setOpen(false)
          onSuccess?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && availableTransitions.length > 0 && (
        <DialogTrigger render={<Button>Change Status</Button>} />
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {changeStatusMutation.isError && (
            <p className="text-sm text-destructive">
              {changeStatusMutation.error.message}
            </p>
          )}

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger aria-label="Status">
                  <SelectValue placeholder="Select a status">
                    {(value: string | null) =>
                      value
                        ? formatStatus(value as ApplicationStatus)
                        : 'Select a status'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {selectedStatus === 'INTERVIEW_SCHEDULED' && (
            <Controller
              name="interviewCategory"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger aria-label="Interview Category">
                    <SelectValue placeholder="Select a category">
                      {(value: string | null) =>
                        value === 'TECHNICAL'
                          ? 'Technical'
                          : value === 'NON_TECHNICAL'
                            ? 'Non-technical'
                            : 'Select a category'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="NON_TECHNICAL">
                      Non-technical
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input id="eventDate" type="date" {...register('eventDate')} />
            {errors.eventDate && (
              <span className="text-sm text-destructive">
                {errors.eventDate.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register('contactName')} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" {...register('contactEmail')} />
            {errors.contactEmail && (
              <span className="text-sm text-destructive">
                {errors.contactEmail.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={changeStatusMutation.isPending}>
              {changeStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
