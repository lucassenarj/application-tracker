export function RouteLoadingBar() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-transparent"
    >
      <div className="h-full w-2/5 animate-loading-slide bg-linear-to-r from-primary via-accent to-primary" />
    </div>
  )
}
