import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "block w-full rounded-md border-2 border-[#E5E7EB] bg-white font-medium px-4 py-3 text-base shadow-sm font-[Figtree,Inter,sans-serif] text-[#333] focus:border-[#fd655c] focus:ring-2 focus:ring-coral-200 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = "Select"

export { Select } 