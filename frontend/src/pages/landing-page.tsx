import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppFooter } from '@/components/app-footer'
import { Button } from '@/components/ui/button'
import { userQueryOptions } from '@/lib/auth/user-query'

const FEATURES = [
  {
    title: 'Track every stage',
    description:
      'Move applications through a real pipeline, applied, interviewing, offer, and everything in between, so you always know where things stand.',
    image: '/images/list-applications.jpg',
    ratio: '1586/727',
  },
  {
    title: 'Never miss an interview',
    description:
      'See every upcoming interview on a calendar built for this, not a generic one you have to cross-reference.',
    image: '/images/calendar.jpg',
    ratio: '1586/727',
  },
  {
    title: 'Tag applications with what matters to you',
    description:
      'Tag applications with what matters to you, role type, stack, work style, and see which combinations actually land interviews.',
    image: '/images/tags.jpg',
    ratio: '1586/727',
  },
  {
    title: 'Your search, at a glance',
    description:
      'A dashboard that shows totals, offers, rejections, and trends over time, without digging through a spreadsheet.',
    image: '/images/search.jpg',
    ratio: '1586/727',
  },
] as const

const TOUR_SCREENS = [
  {
    title: 'Dashboard',
    caption:
      'Open to a clear picture: how many applications are active, how many turned into offers, and how your search has moved over time, all before you dig into a single row.',
    image: '/images/dashboard-page.jpg',
    ratio: '1880/963',
  },
  {
    title: 'Applications List',
    caption:
      "Every application, filterable by status, category, or tag. Search by title or company. Nothing to scroll through that doesn't matter right now.",
    image: '/images/application-list-page.jpg',
    ratio: '1880/963',
  },
  {
    title: 'Application Detail',
    caption:
      'A full timeline of every status change, interview, and note, so you can see exactly how an application got to where it is, not just where it is.',
    image: '/images/application-details-page.jpg',
    ratio: '1880/963',
  },
] as const

export function LandingPage() {
  const userQuery = useQuery(userQueryOptions)
  const isLoggedIn = userQuery.isSuccess

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Every application. One place. Zero spreadsheets.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        From application to offer, track every step, start to finish.
      </p>
      <div className="flex gap-3">
        {isLoggedIn ? (
          <Button
            nativeButton={false}
            render={<Link to="/dashboard">Go to Dashboard</Link>}
          />
        ) : (
          <Button
            nativeButton={false}
            render={<Link to="/register">Start tracking, it&apos;s free</Link>}
          />
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/login">Log in</Link>}
        />
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 py-16 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-3 text-left">
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full rounded-lg border border-border object-cover"
              style={{ aspectRatio: feature.ratio }}
            />
            <h2 className="text-xl font-semibold">{feature.title}</h2>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-5xl flex-col gap-16 py-16">
        {TOUR_SCREENS.map((screen, index) => (
          <div
            key={screen.title}
            className={`flex flex-col items-center gap-8 md:flex-row ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
          >
            <img
              src={screen.image}
              alt={screen.title}
              className="w-full rounded-lg border border-border object-cover md:w-1/2"
              style={{ aspectRatio: screen.ratio }}
            />
            <div className="flex flex-col gap-3 text-left md:w-1/2">
              <h2 className="text-2xl font-semibold">{screen.title}</h2>
              <p className="text-muted-foreground">{screen.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-2xl py-16 text-left">
        <h2 className="mb-4 text-2xl font-semibold">Why I built this</h2>
        <p className="text-muted-foreground">
          I built this because I needed it, job searching gets messy fast, and spreadsheets weren&apos;t cutting it. It&apos;s also a deliberate learning project: a chance to practice real architecture, test-driven development, and domain-driven design end to end, not just read about them. Every part of it, from the status pipeline to the tagging system, was built test-first, with real design decisions behind it, not just scaffolded and left.
        </p>
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center gap-4 border-t border-border pt-12">
        <nav aria-label="Footer" className="flex gap-4 text-sm">
          <Link to="/login" className="hover:underline">
            Log in
          </Link>
          <Link to="/register" className="hover:underline">
            Register
          </Link>
          <a
            href="https://github.com/lucassenarj/application-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </nav>
        <AppFooter />
      </div>
    </div>
  )
}
