import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg text-fg">
      <h1 className="font-heading text-6xl tracking-wide">404</h1>
      <p className="mt-4 text-fg-muted text-sm tracking-widest">Page not found</p>
      <Link
        href="/"
        className="mt-8 text-xs tracking-[0.2em] text-fg-subtle hover:text-fg transition-colors"
      >
        &larr; Back to Home
      </Link>
    </div>
  )
}
