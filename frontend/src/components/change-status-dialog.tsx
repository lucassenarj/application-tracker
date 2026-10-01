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
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ChangeStatusDialog({
  applicationId,
  availableTransitions,
}: ChangeStatusDialogProps) {
  const [open, setOpen] = useState(false)
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
      status: '',
      eventDate: todayIso(),
      contactName: '',
      contactEmail: '',
      notes: '',
    },
  })

  const selectedStatus = watch('status')

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
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Change Status</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
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
                  <SelectValue placeholder="Select a status" />
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
                    <SelectValue placeholder="Select a category" />
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input id="eventDate" type="date" {...register('eventDate')} />
            {errors.eventDate && (
              <span className="text-sm text-destructive">
                {errors.eventDate.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register('contactName')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" {...register('contactEmail')} />
            {errors.contactEmail && (
              <span className="text-sm text-destructive">
                {errors.contactEmail.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
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
