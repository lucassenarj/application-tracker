import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({
  count = 5,
  className = 'h-10 w-full',
}: SkeletonListProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}
