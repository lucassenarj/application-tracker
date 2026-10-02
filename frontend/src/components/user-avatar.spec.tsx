import { render, screen } from '@testing-library/react'
import { UserAvatar } from '@/components/user-avatar'
import type { User } from '@/lib/auth/user-query'

const baseUser: User = {
  id: '1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('UserAvatar', () => {
  it('renders the avatar image when set', () => {
    render(
      <UserAvatar
        user={{ ...baseUser, avatar: 'https://example.com/a.png' }}
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    )
  })

  it('renders an initial-letter placeholder when no avatar is set', () => {
    render(<UserAvatar user={baseUser} />)

    expect(screen.getByRole('paragraph')).toHaveTextContent('J')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
