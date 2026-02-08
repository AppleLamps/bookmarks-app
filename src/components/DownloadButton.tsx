"use client";

import { Bookmark } from "@/types";

interface DownloadButtonProps {
  bookmarks: Bookmark[];
  username: string;
}

export default function DownloadButton({ bookmarks, username }: DownloadButtonProps) {
  const handleDownload = () => {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split("T")[0];

    const a = document.createElement("a");
    a.href = url;
    a.download = `x-bookmarks-${username}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (bookmarks.length === 0) return null;

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3.5 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--surface-hover)] active:scale-[0.98] transition-all duration-200"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download ({bookmarks.length})
    </button>
  );
}
