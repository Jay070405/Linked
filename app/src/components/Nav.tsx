import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { MagicHatLogo } from "@/components/MagicHatLogo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "首页" },
  { to: "/about", label: "关于" },
  { to: "/portfolio", label: "作品集" },
  { to: "/contact", label: "联系" },
]

export function Nav() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const navLinks = (
    <ul className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      {links.map(({ to, label }) => (
        <li key={to}>
          <Link
            to={to}
            onClick={() => setOpen(false)}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname === to ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <MagicHatLogo size={24} className="text-primary" />
          <span className="hidden sm:inline-block">Shijie Lin</span>
        </Link>
        <nav className="hidden sm:block">{navLinks}</nav>
        <Sheet open={open} onOpenChange={setOpen} side="right">
          <SheetTrigger className="sm:hidden">
            <Button variant="ghost" size="icon" aria-label="打开菜单">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="pt-12">
            <SheetHeader />
            {navLinks}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
