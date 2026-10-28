interface BrandMarkProps {
  size?: number
  className?: string
}

export function BrandMark({ size = 36, className }: BrandMarkProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      className={`flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent font-bold text-primary-foreground shadow-lg shadow-primary/30 ${className ?? ''}`}
    >
      A
    </div>
  )
}
