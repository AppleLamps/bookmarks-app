export default function SignInButton() {
  return (
    <a
      href="/api/auth/login"
      className="group inline-flex items-center gap-3 px-7 py-3.5 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Sign in with X
      <svg className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
