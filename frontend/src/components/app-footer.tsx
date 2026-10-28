export function AppFooter() {
  return (
    <footer className="py-5 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} Application Tracker · v{__APP_VERSION__} ·
        Designed by{' '}
        <a
          href="https://templatemo.com"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-primary hover:underline"
        >
          TemplateMo
        </a>
      </p>
    </footer>
  )
}
