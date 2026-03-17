export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-16" style={{ background: "hsl(240 8% 2.5%)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="font-heading text-xs tracking-[0.35em] text-fg-muted">
            SHIJIE LIN
          </p>
          <div className="h-px w-10 bg-accent/20" />
          <p className="text-[10px] tracking-[0.2em] text-fg-subtle">
            &copy; {new Date().getFullYear()} &mdash; Fantasy Worldbuilding &
            Concept Art
          </p>
        </div>
      </div>
    </footer>
  )
}
