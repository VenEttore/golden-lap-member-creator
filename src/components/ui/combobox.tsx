import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import ReactDOM from "react-dom"

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
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  renderOption,
  renderValue,
  className = "",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLUListElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})
  const selected = options.find(o => o.value === value)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

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

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  React.useEffect(() => {
    if (open) setHighlightedIndex(0)
  }, [open, search])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
    }
  }

  React.useEffect(() => {
    if (open && dropdownRef.current && filtered.length > 0) {
      const items = dropdownRef.current.querySelectorAll('li[data-index]')
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, open, filtered.length])

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
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2">
          {renderValue ? renderValue(selected) : selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-400" />
      </button>
      {open &&
        ReactDOM.createPortal(
          <div
            className="rounded-md bg-white border border-gray-200 shadow-lg"
            style={dropdownStyle}
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
              />
            </div>
            <ul
              ref={dropdownRef}
              className="max-h-64 overflow-y-auto py-1"
              tabIndex={-1}
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-2 text-gray-400">No results</li>
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
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                        setSearch("")
                      }}
                    >
                      {renderOption ? renderOption(option, isSelected) : option.label}
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
} 