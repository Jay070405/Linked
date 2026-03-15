import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: "top" | "right" | "bottom" | "left"
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheet() {
  const ctx = React.useContext(SheetContext)
  if (!ctx) throw new Error("Sheet components must be used within Sheet")
  return ctx
}

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: "top" | "right" | "bottom" | "left"
  children: React.ReactNode
}

function Sheet({ open = false, onOpenChange, side = "right", children }: SheetProps) {
  const value = React.useMemo(
    () => ({ open, onOpenChange: onOpenChange ?? (() => {}), side }),
    [open, onOpenChange, side]
  )
  return (
    <SheetContext.Provider value={value}>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          aria-hidden
          onClick={() => onOpenChange?.(false)}
        />
      )}
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, onClick, children, ...props }, ref) => {
  const { onOpenChange } = useSheet()
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(true)
    onClick?.(e)
  }
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        child.props?.onClick?.(e)
      },
    })
  }
  return (
    <button
      ref={ref}
      type="button"
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

function SheetClose({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useSheet()
  return (
    <button
      type="button"
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "right" | "bottom" | "left" }
>(({ side: sideProp, className, children, ...props }, ref) => {
  const { open, side } = useSheet()
  if (!open) return null
  const s = sideProp ?? side
  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg transition ease-in-out",
        s === "right" && "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        s === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        s === "top" && "inset-x-0 top-0 border-b",
        s === "bottom" && "inset-x-0 bottom-0 border-t",
        className
      )}
      {...props}
    >
      <SheetClose />
      {children}
    </div>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
))
SheetHeader.displayName = "SheetHeader"

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader }
