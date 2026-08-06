"use client"

import { useLanguage } from "@/components/LanguageProvider"

export function Footer() {
  const { language } = useLanguage()

  return (
    <footer className="border-t border-white/[0.06] bg-[#030303] py-14">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-4 px-5 text-center md:px-10 xl:px-14">
        <p className="font-heading text-lg tracking-[-0.02em] text-white">Jay Lin</p>
        <div className="h-px w-12 bg-white/26" />
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/46">
          {language === "en"
            ? "Visual Development Artist / Concept Artist"
            : "\u89c6\u89c9\u5f00\u53d1\u827a\u672f\u5bb6 / \u6982\u5ff5\u8bbe\u8ba1\u5e08"}
        </p>
        <p className="text-[0.72rem] tracking-[0.18em] text-white/34">
          {language === "en"
            ? `\u00A9 ${new Date().getFullYear()} Selected worlds, sketches, and stories.`
            : `\u00A9 ${new Date().getFullYear()} \u7cbe\u9009\u4e16\u754c\u3001\u8349\u56fe\u4e0e\u89c6\u89c9\u53d9\u4e8b\u3002`}
        </p>
      </div>
    </footer>
  )
}
