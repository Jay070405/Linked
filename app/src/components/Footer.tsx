import { MagicHatLogo } from "@/components/MagicHatLogo"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MagicHatLogo size={18} className="opacity-70" />
          <span className="text-sm">© Shijie Lin</span>
        </div>
        <Separator className="w-16" />
      </div>
    </footer>
  )
}
