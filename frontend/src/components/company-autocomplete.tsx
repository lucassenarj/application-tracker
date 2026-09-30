import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { companySearchQueryOptions } from '@/lib/companies/company-search'

interface CompanyAutocompleteProps {
  id?: string
  value: string
  onChange: (company: { name: string; companyId?: string }) => void
}

export function CompanyAutocomplete({
  id,
  value,
  onChange,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const query = useQuery(companySearchQueryOptions(value))

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange({ name: e.target.value, companyId: undefined })
          setIsOpen(true)
        }}
        onBlur={() => setIsOpen(false)}
        autoComplete="off"
      />
      {isOpen && query.data && query.data.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {query.data.map((company) => (
            <li key={company.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ name: company.name, companyId: company.id })
                  setIsOpen(false)
                }}
              >
                {company.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
