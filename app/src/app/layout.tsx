import type { Metadata } from "next"
import { Cinzel, Outfit } from "next/font/google"
import "./globals.css"
import { FluidCanvas } from "@/components/FluidCanvas"
import { CustomCursor } from "@/components/CustomCursor"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Shijie Lin — Concept Art & Visual Development",
  description:
    "Fantasy worldbuilding, concept art, and visual development portfolio by Shijie Lin.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${outfit.variable}`}>
      <body className="font-sans">
        <FluidCanvas />
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
