import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SignInButton from "@/components/SignInButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-gray-200/40 to-transparent dark:from-gray-800/20 rounded-full blur-3xl" />

      <div className="relative max-w-lg w-full mx-auto px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 mb-8 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Simple & fast export
        </div>

        {/* Heading */}
        <h1 className="animate-fade-in-delay-1 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
          Bookmark
          <br />
          <span className="text-gray-400 dark:text-gray-500">Export</span>
        </h1>

        <p className="animate-fade-in-delay-2 text-base text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto leading-relaxed">
          Export your X bookmarks as structured JSON.
          <br className="hidden sm:block" />
          Get your first 25 free.
        </p>

        {error && (
          <div className="animate-fade-in-scale mb-8 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
            {error === "auth_denied" && "Authorization was denied."}
            {error === "auth_failed" && "Authentication failed. Please try again."}
            {error === "missing_params" && "Invalid callback. Please try again."}
            {error === "invalid_state" && "Invalid session state. Please try again."}
          </div>
        )}

        <div className="animate-fade-in-delay-3 flex flex-col items-center gap-4">
          <SignInButton />
          <a
            href="/view"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View existing export
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Features row */}
        <div className="animate-fade-in-delay-3 mt-14 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            25 free
          </div>
          <div className="w-px h-3 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            $1 / 500
          </div>
          <div className="w-px h-3 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            JSON export
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-[11px] text-gray-300 dark:text-gray-700 tracking-wide">
        bookmark export
      </footer>
    </main>
  );
}
