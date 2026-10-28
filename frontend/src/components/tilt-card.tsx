import { useRef, type MouseEvent, type ReactNode } from 'react'
import { computeTilt } from '@/lib/tilt'

interface TiltCardProps {
  children: ReactNode
  className?: string
}

export function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const element = ref.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const { rotateX, rotateY } = computeTilt(event.clientX, event.clientY, rect)

    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
  }

  const handleMouseLeave = () => {
    const element = ref.current
    if (!element) return

    element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-[400ms] ease-[cubic-bezier(0.03,0.98,0.52,0.99)] ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
