import { cn } from 'cn'
import type { User } from '@/lib/auth/user-query'

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.name || user.email}'s avatar`}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted font-medium',
        className,
      )}
    >
      <p>{(user.name ?? user.email).charAt(0).toUpperCase()}</p>
    </div>
  )
}
