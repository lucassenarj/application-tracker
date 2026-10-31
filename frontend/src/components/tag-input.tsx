import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { SuggestionsDropdown } from '@/components/suggestions-dropdown'
import { tagSearchQueryOptions } from '@/lib/tags/tag-search'
import type { Tag } from '@/lib/tags/tag-search'

interface TagInputProps {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ id, value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const query = useQuery({
    ...tagSearchQueryOptions(inputValue),
    enabled: isOpen,
  })

  const suggestions = (query.data ?? []).filter(
    (tag) => !value.includes(tag.name),
  )

  function addTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInputValue('')
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name))
  }

  return (
    <div className="relative">
      <div
        className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-input/30 px-[18px] py-[10px] transition-colors focus-within:border-emerald-light focus-within:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="h-auto cursor-pointer rounded-md px-3 py-2 hover:bg-accent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              removeTag(tag)
            }}
          >
            {tag}
            <button type="button" aria-label={`Remove ${tag}`}>
              ×
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(inputValue)
            }
          }}
          onBlur={() => setIsOpen(false)}
          autoComplete="off"
          className="min-w-[80px] flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground md:text-sm"
        />
        {isOpen ? (
          <ChevronUpIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        )}
      </div>
      <SuggestionsDropdown
        items={suggestions}
        isOpen={isOpen}
        getKey={(tag: Tag) => tag.id}
        getLabel={(tag: Tag) => tag.name}
        onSelect={(tag) => addTag(tag.name)}
      />
    </div>
  )
}
