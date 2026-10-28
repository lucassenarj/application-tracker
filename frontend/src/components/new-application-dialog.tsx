import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CompanyAutocomplete } from '@/components/company-autocomplete'
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
import { useCreateApplicationMutation } from '@/lib/applications/create-application'
import {
  createApplicationSchema,
  type CreateApplicationFormValues,
} from '@/lib/applications/create-application-schema'
import { userQueryOptions } from '@/lib/auth/user-query'

export function NewApplicationDialog() {
  const [open, setOpen] = useState(false)
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const createApplicationMutation = useCreateApplicationMutation()
  const userQuery = useQuery(userQueryOptions)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateApplicationFormValues>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      title: '',
      companyName: '',
      description: '',
      externalUrl: '',
      salary: '',
      currency: userQuery.data?.defaultCurrency ?? 'EUR',
    },
  })

  const onSubmit = (values: CreateApplicationFormValues) => {
    createApplicationMutation.mutate(
      {
        title: values.title,
        companyName: values.companyName,
        companyId,
        description: values.description || undefined,
        externalUrl: values.externalUrl || undefined,
        salary: values.salary ? Number(values.salary) : undefined,
        currency: values.currency || undefined,
      },
      {
        onSuccess: () => {
          reset()
          setCompanyId(undefined)
          setOpen(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-[45px] gap-1.5 bg-background/40 text-[13px] text-muted-foreground backdrop-blur-sm hover:border-emerald-light hover:bg-sidebar-accent hover:text-foreground"
          >
            <Plus />
            Add Application
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {createApplicationMutation.isError && (
            <p className="text-sm text-destructive">
              {createApplicationMutation.error.message}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <span className="text-sm text-destructive">
                {errors.title.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="companyName">Company</Label>
            <Controller
              name="companyName"
              control={control}
              render={({ field }) => (
                <CompanyAutocomplete
                  id="companyName"
                  value={field.value ?? ''}
                  onChange={({ name, companyId: selectedId }) => {
                    field.onChange(name)
                    setCompanyId(selectedId)
                  }}
                />
              )}
            />
            {errors.companyName && (
              <span className="text-sm text-destructive">
                {errors.companyName.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="externalUrl">Job posting URL</Label>
            <Input id="externalUrl" {...register('externalUrl')} />
            {errors.externalUrl && (
              <span className="text-sm text-destructive">
                {errors.externalUrl.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" type="number" {...register('salary')} />
              {errors.salary && (
                <span className="text-sm text-destructive">
                  {errors.salary.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency" aria-label="Currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={createApplicationMutation.isPending}
            >
              {createApplicationMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
