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
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <div className="font-bold text-lg">Bookmark Export</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileImageUrl}
            alt={username}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            @{username}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
