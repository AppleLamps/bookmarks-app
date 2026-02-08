"use client";

interface HeaderProps {
  username: string;
  profileImageUrl: string;
}

export default function Header({ username, profileImageUrl }: HeaderProps) {
  const handleLogout = async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-80" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="font-semibold text-sm tracking-tight">Bookmark Export</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileImageUrl}
            alt={username}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs text-[var(--muted)] font-medium">
            @{username}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
