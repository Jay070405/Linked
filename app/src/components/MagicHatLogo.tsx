interface MagicHatLogoProps {
  className?: string
  size?: number
}

export function MagicHatLogo({ className = "", size = 28 }: MagicHatLogoProps) {
  return (
    <img
      src="/magic-hat-logo.svg"
      alt=""
      width={size}
      height={size}
      className={className}
    />
  )
}
