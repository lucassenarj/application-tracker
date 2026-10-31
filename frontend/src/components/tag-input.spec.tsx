import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TagInput } from '@/components/tag-input'
import { fetchMock } from '@/test-setup'

function ControlledWrapper({
  initialValue = [],
  onChange,
}: {
  initialValue?: string[]
  onChange: (tags: string[]) => void
}) {
  const [value, setValue] = useState<string[]>(initialValue)
  return (
    <TagInput
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

function renderTagInput({
  initialValue,
  onChange,
}: {
  initialValue?: string[]
  onChange: (tags: string[]) => void
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ControlledWrapper initialValue={initialValue} onChange={onChange} />
    </QueryClientProvider>,
  )
}

function mockTagSearchResults(tags: { id: string; name: string }[] = []) {
  fetchMock.mockImplementation(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(tags) }),
  )
}

describe('TagInput', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    onChange.mockReset()
    mockTagSearchResults()
  })

  it('renders a badge for each selected tag', () => {
    renderTagInput({ initialValue: ['Remote', 'Dream Job'], onChange })

    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('Dream Job')).toBeInTheDocument()
  })

  it('removing a tag calls onChange without it', async () => {
    const user = userEvent.setup()
    renderTagInput({ initialValue: ['Remote', 'Dream Job'], onChange })

    await user.click(screen.getByRole('button', { name: 'Remove Remote' }))

    expect(onChange).toHaveBeenLastCalledWith(['Dream Job'])
  })

  it('renders suggestions returned by the search query', async () => {
    const user = userEvent.setup()
    mockTagSearchResults([{ id: '1', name: 'Remote' }])
    renderTagInput({ onChange })

    await user.type(screen.getByRole('textbox'), 'Rem')

    expect(
      await screen.findByRole('button', { name: 'Remote' }),
    ).toBeInTheDocument()
  })

  it('selecting a suggestion adds it and clears the input', async () => {
    const user = userEvent.setup()
    mockTagSearchResults([{ id: '1', name: 'Remote' }])
    renderTagInput({ onChange })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Rem')
    await user.click(await screen.findByRole('button', { name: 'Remote' }))

    expect(onChange).toHaveBeenLastCalledWith(['Remote'])
    expect(input).toHaveValue('')
  })

  it('shows suggestions when focused, even before typing anything', async () => {
    const user = userEvent.setup()
    mockTagSearchResults([{ id: '1', name: 'Remote' }])
    renderTagInput({ onChange })

    await user.click(screen.getByRole('textbox'))

    expect(
      await screen.findByRole('button', { name: 'Remote' }),
    ).toBeInTheDocument()
  })

  it('keeps the dropdown open after selecting, so more tags can be picked', async () => {
    const user = userEvent.setup()
    mockTagSearchResults([
      { id: '1', name: 'Remote' },
      { id: '2', name: 'Dream Job' },
    ])
    renderTagInput({ onChange })

    await user.click(screen.getByRole('textbox'))
    await user.click(await screen.findByRole('button', { name: 'Remote' }))

    expect(
      await screen.findByRole('button', { name: 'Dream Job' }),
    ).toBeInTheDocument()
  })

  it('pressing Enter with free-form text adds it as a new tag and clears the input', async () => {
    const user = userEvent.setup()
    renderTagInput({ onChange })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Brand New Tag{Enter}')

    expect(onChange).toHaveBeenLastCalledWith(['Brand New Tag'])
    expect(input).toHaveValue('')
  })

  it('does not add a duplicate tag that is already selected', async () => {
    const user = userEvent.setup()
    renderTagInput({ initialValue: ['Remote'], onChange })

    await user.type(screen.getByRole('textbox'), 'Remote{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('excludes already-selected tags from the suggestions dropdown', async () => {
    const user = userEvent.setup()
    mockTagSearchResults([
      { id: '1', name: 'Remote' },
      { id: '2', name: 'Dream Job' },
    ])
    renderTagInput({ initialValue: ['Remote'], onChange })

    await user.type(screen.getByRole('textbox'), 'e')

    expect(
      await screen.findByRole('button', { name: 'Dream Job' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remote' }),
    ).not.toBeInTheDocument()
  })
})
