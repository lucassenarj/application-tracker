import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { SuggestionsDropdown } from '@/components/suggestions-dropdown'

interface Item {
  id: string
  name: string
}

const items: Item[] = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'Acme Industries' },
]

function renderDropdown(
  overrides: Partial<ComponentProps<typeof SuggestionsDropdown<Item>>> = {},
) {
  return render(
    <SuggestionsDropdown
      items={items}
      isOpen={true}
      getKey={(item: Item) => item.id}
      getLabel={(item: Item) => item.name}
      onSelect={vi.fn()}
      {...overrides}
    />,
  )
}

describe('SuggestionsDropdown', () => {
  it('renders nothing when isOpen is false', () => {
    renderDropdown({ isOpen: false })

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no items, even if open', () => {
    renderDropdown({ items: [] })

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders a button per item using getLabel', () => {
    renderDropdown()

    expect(
      screen.getByRole('button', { name: 'Acme Corp' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Acme Industries' }),
    ).toBeInTheDocument()
  })

  it('calls onSelect with the clicked item', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderDropdown({ onSelect })

    await user.click(screen.getByRole('button', { name: 'Acme Corp' }))

    expect(onSelect).toHaveBeenCalledWith(items[0])
  })
})
