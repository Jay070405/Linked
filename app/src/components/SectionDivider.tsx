import { cn } from "@/lib/utils"

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-4", className)} aria-hidden>
      <img
        src="/magic-hat-divider.svg"
        alt=""
        className="h-6 w-auto opacity-60"
      />
    </div>
  )
}
