import React from 'react'
import { Search } from 'lucide-react'

interface EventFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  )
}
