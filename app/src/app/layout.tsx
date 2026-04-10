import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { Noto_Sans_SC, Geist } from "next/font/google"
import { CustomCursor } from "@/components/CustomCursor"
import { LanguageProvider } from "@/components/LanguageProvider"
import "./globals.css"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-display-cn",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Jay Lin - Concept Art & Visual Development",
  description:
    "Fantasy worldbuilding, concept art, and visual development portfolio by Jay Lin.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, notoSansSc.variable, "font-sans", geist.variable)}
    >
      <body className="font-sans">
        <LanguageProvider>
          <CustomCursor />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
