import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreatePersonalAccessTokenDialog } from '@/components/create-personal-access-token-dialog'
import { PageHeader } from '@/components/page-header'
import { personalAccessTokensQueryOptions } from '@/lib/auth/personal-access-tokens'
import { useRevokePersonalAccessTokenMutation } from '@/lib/auth/revoke-personal-access-token'

export function ApiTokensPage() {
  const query = useQuery(personalAccessTokensQueryOptions())
  const revokeMutation = useRevokePersonalAccessTokenMutation()
  const [confirmingTokenId, setConfirmingTokenId] = useState<string | null>(
    null,
  )

  return (
    <div className="flex flex-col gap-[30px]">
      <PageHeader title="API Tokens" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personal Access Tokens</CardTitle>
            <CardDescription>
              Tokens let third-party clients, like the browser extension,
              create applications on your behalf.
            </CardDescription>
          </div>
          <CreatePersonalAccessTokenDialog />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {query.isPending && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {query.isError && (
            <p className="text-sm text-destructive">{query.error.message}</p>
          )}

          {query.isSuccess && query.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tokens yet. Create one to get started.
            </p>
          )}

          {query.isSuccess && query.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium text-foreground">
                      {token.label}
                    </TableCell>
                    <TableCell>
                      {new Date(token.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {token.expiresAt
                        ? new Date(token.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {token.lastUsedAt
                        ? new Date(token.lastUsedAt).toLocaleDateString()
                        : 'Never used'}
                    </TableCell>
                    <TableCell>
                      {token.revokedAt ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                        >
                          Valid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!token.revokedAt && (
                        <AlertDialog
                          open={confirmingTokenId === token.id}
                          onOpenChange={(open) =>
                            setConfirmingTokenId(open ? token.id : null)
                          }
                        >
                          <AlertDialogTrigger
                            render={
                              <Button variant="outline" size="sm">
                                Revoke
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke this token?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Any client using this token will immediately
                                lose access. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <Button
                                variant="destructive"
                                disabled={revokeMutation.isPending}
                                onClick={() =>
                                  revokeMutation.mutate(token.id, {
                                    onSuccess: () =>
                                      setConfirmingTokenId(null),
                                  })
                                }
                              >
                                {revokeMutation.isPending
                                  ? 'Revoking...'
                                  : 'Yes, Revoke'}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
