import { PasswordInput } from '@/components/password-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { Switch } from '@/components/ui/switch'

const ACTIVE_SESSIONS: Array<{
  device: string
  location: string
  status: 'current' | 'other'
  lastActive?: string
}> = [
  { device: 'Chrome on MacOS', location: 'San Francisco, CA', status: 'current' },
  {
    device: 'Safari on iPhone',
    location: 'San Francisco, CA',
    status: 'other',
    lastActive: '2 hours ago',
  },
  {
    device: 'Firefox on Windows',
    location: 'New York, NY',
    status: 'other',
    lastActive: '3 days ago',
  },
]

const TWO_FACTOR_OPTIONS = [
  {
    label: 'Enable 2FA',
    description: 'Add an extra layer of security to your account',
    defaultChecked: false,
  },
  {
    label: 'SMS Authentication',
    description: 'Receive codes via SMS',
    defaultChecked: true,
  },
  {
    label: 'Authenticator App',
    description: 'Use Google Authenticator or similar',
    defaultChecked: false,
  },
] as const

export function SecurityPage() {
  return (
    <div className="flex flex-col gap-[30px]">
      <PageHeader title="Security" />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <h2 className="text-lg font-heading font-semibold">Change Password</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput id="currentPassword" placeholder="Enter current password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput id="newPassword" placeholder="Enter new password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput id="confirmPassword" placeholder="Confirm new password" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button">Update Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg font-heading font-semibold">
            Two-Factor Authentication
          </h2>
          {TWO_FACTOR_OPTIONS.map((option) => (
            <div
              key={option.label}
              className="flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">
                  {option.description}
                </span>
              </div>
              <Switch
                aria-label={option.label}
                defaultChecked={option.defaultChecked}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg font-heading font-semibold">Active Sessions</h2>
          {ACTIVE_SESSIONS.map((session) => (
            <div
              key={session.device}
              className="flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{session.device}</span>
                <span className="text-sm text-muted-foreground">
                  {session.location} ·{' '}
                  {session.status === 'current'
                    ? 'Current session'
                    : session.lastActive}
                </span>
              </div>
              {session.status === 'current' ? (
                <Badge
                  variant="secondary"
                  className="bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                >
                  Active
                </Badge>
              ) : (
                <Button type="button" variant="outline" size="sm">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
