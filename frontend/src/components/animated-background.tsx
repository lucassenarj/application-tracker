export function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,var(--bg-gradient-1)_0%,var(--bg-gradient-2)_50%,var(--bg-gradient-3)_100%)]" />
      <div className="absolute top-[10%] left-[10%] size-[400px] animate-float rounded-full bg-primary opacity-40 blur-[80px]" />
      <div className="absolute top-[60%] right-[10%] size-[350px] animate-float rounded-full bg-chart-3 opacity-40 blur-[80px] [animation-delay:-5s]" />
      <div className="absolute bottom-[10%] left-[30%] size-[300px] animate-float rounded-full bg-chart-4 opacity-40 blur-[80px] [animation-delay:-10s]" />
    </div>
  )
}
