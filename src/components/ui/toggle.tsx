import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, ...props }, ref) => {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full px-5 py-2 text-base font-bold font-[Figtree,Inter,sans-serif] border-2 transition-colors cursor-pointer",
          pressed
            ? "bg-[#fd655c] text-white border-[#fd655c] hover:bg-white hover:text-[#222] hover:border-[#d1cfc7]"
            : "bg-white text-[#222] border-[#d1cfc7] hover:bg-[#fd655c] hover:text-white hover:border-[#fd655c]",
          className
        )}
        aria-pressed={pressed}
        ref={ref}
        {...props}
      />
    )
  }
)
Toggle.displayName = "Toggle"

export { Toggle } 