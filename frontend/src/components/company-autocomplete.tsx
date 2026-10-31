import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { SuggestionsDropdown } from '@/components/suggestions-dropdown'
import { companySearchQueryOptions } from '@/lib/companies/company-search'
import type { Company } from '@/lib/companies/company-search'

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
      <SuggestionsDropdown
        items={query.data ?? []}
        isOpen={isOpen}
        getKey={(company: Company) => company.id}
        getLabel={(company: Company) => company.name}
        onSelect={(company) => {
          onChange({ name: company.name, companyId: company.id })
          setIsOpen(false)
        }}
      />
    </div>
  )
}
