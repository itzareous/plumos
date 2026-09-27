import { useMemo, useState } from 'react'
import { searchSections } from '../sections'

export function useSectionSearch() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchSections(query), [query])
  return { query, setQuery, results, searching: query.trim().length > 0 }
}
