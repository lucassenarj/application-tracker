import { Link } from '@tanstack/react-router'

interface PageHeaderParent {
  label: string
  to: '/applications'
  search: { page: number }
}

interface PageHeaderProps {
  title: string
  parent?: PageHeaderParent
}

export function PageHeader({ title, parent }: PageHeaderProps) {
  return (
    <div className="mb-[30px]">
      <h1 className="text-[28px] font-heading font-semibold">{title}</h1>
      <div className="mt-2 flex items-center gap-2 text-[13px]">
        <Link
          to="/dashboard"
          className="text-foreground/70 transition-colors hover:text-emerald-light"
        >
          Dashboard
        </Link>
        {parent && (
          <>
            <span className="text-muted-foreground">/</span>
            <Link
              to={parent.to}
              search={parent.search}
              className="text-foreground/70 transition-colors hover:text-emerald-light"
            >
              {parent.label}
            </Link>
          </>
        )}
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{title}</span>
      </div>
    </div>
  )
}
