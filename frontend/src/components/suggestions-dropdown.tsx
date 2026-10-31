interface SuggestionsDropdownProps<T> {
  items: T[]
  isOpen: boolean
  getKey: (item: T) => string
  getLabel: (item: T) => string
  onSelect: (item: T) => void
}

export function SuggestionsDropdown<T>({
  items,
  isOpen,
  getKey,
  getLabel,
  onSelect,
}: SuggestionsDropdownProps<T>) {
  if (!isOpen || items.length === 0) return null

  return (
    <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
      {items.map((item) => (
        <li key={getKey(item)}>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(item)}
          >
            {getLabel(item)}
          </button>
        </li>
      ))}
    </ul>
  )
}
