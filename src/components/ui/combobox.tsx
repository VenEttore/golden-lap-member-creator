import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { Portal } from "@radix-ui/react-portal"
import { useCallback, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  iconUrl?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  renderOption?: (option: ComboboxOption, selected: boolean) => React.ReactNode
  renderValue?: (option: ComboboxOption | undefined) => React.ReactNode
  className?: string
  ariaLabel?: string
  ariaDescription?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  renderOption,
  renderValue,
  className = "",
  ariaLabel = "Combobox",
  ariaDescription = "Select an option from the list",
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const selected = useMemo(() => options.find(o => o.value === value), [options, value])

  const filtered = useMemo(() => 
    search
      ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
      : options,
    [options, search]
  )

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setOpen(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, handleClickOutside])

  React.useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 50,
      })
    }
  }, [open])

  React.useEffect(() => {
    if (open) setHighlightedIndex(0)
  }, [open, search])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex(i => (i + 1) % filtered.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(i => (i - 1 + filtered.length) % filtered.length)
    } else if (e.key === "Enter") {
      if (filtered[highlightedIndex]) {
        onChange(filtered[highlightedIndex].value)
        setOpen(false)
        setSearch("")
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }, [open, filtered, highlightedIndex, onChange])

  React.useEffect(() => {
    if (open && dropdownRef.current && filtered.length > 0) {
      const items = dropdownRef.current.querySelectorAll('li[data-index]')
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, open, filtered.length])

  const handleOptionClick = useCallback((option: ComboboxOption) => {
    onChange(option.value)
    setOpen(false)
    setSearch("")
  }, [onChange])

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base font-medium shadow-sm focus:border-coral-500 focus:ring-2 focus:ring-coral-200 transition font-[Figtree,Inter,sans-serif] text-[#333]",
          open && "border-coral-500 ring-2 ring-coral-200"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-describedby="combobox-description"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2">
          {renderValue ? renderValue(selected) : selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-400" />
      </button>
      <span id="combobox-description" className="sr-only">{ariaDescription}</span>
      {open && (
        <Portal>
          <div
            className="rounded-md bg-white border border-gray-200 shadow-lg"
            style={dropdownStyle}
            role="listbox"
            aria-label={ariaLabel}
          >
            <div className="px-3 py-2 border-b border-gray-100 bg-white sticky top-0 z-10">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full rounded border border-gray-200 px-2 py-1 text-base focus:outline-none focus:border-coral-500 text-[#222] placeholder-[#888]"
                autoFocus
                aria-label="Search options"
                aria-controls="combobox-options"
              />
            </div>
            <ul
              ref={dropdownRef}
              id="combobox-options"
              className="max-h-64 overflow-y-auto py-1"
              tabIndex={-1}
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-2 text-gray-400" role="option">No results</li>
              ) : (
                filtered.map((option, idx) => {
                  const isSelected = option.value === value
                  const isHighlighted = idx === highlightedIndex
                  return (
                    <li
                      key={option.value}
                      data-index={idx}
                      className={cn(
                        "flex items-center px-3 py-2 cursor-pointer font-[Figtree,Inter,sans-serif] text-black transition-all",
                        (isHighlighted)
                          ? "bg-[#fbe7e6] border-l-4 border-coral-500 pl-5"
                          : (idx % 2 === 0 ? "bg-white" : "bg-[#f0ede7]")
                      )}
                      style={{
                        fontFamily: 'Figtree,Inter,sans-serif',
                        color: '#222',
                        transition: 'all 0.13s',
                      }}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleOptionClick(option)}
                    >
                      {renderOption ? renderOption(option, isSelected) : option.label}
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </Portal>
      )}
    </div>
  )
} 