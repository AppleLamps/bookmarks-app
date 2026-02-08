import { Bookmark } from "@/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const date = new Date(bookmark.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const tweetUrl = bookmark.author
    ? `https://x.com/${bookmark.author.username}/status/${bookmark.id}`
    : `https://x.com/i/status/${bookmark.id}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-2">
        {bookmark.author && (
          <>
            <span className="font-medium text-sm">{bookmark.author.name}</span>
            <span className="text-xs text-[var(--muted)]">@{bookmark.author.username}</span>
          </>
        )}
        <span className="text-xs text-[var(--muted)] ml-auto tabular-nums">{date}</span>
      </div>

      <p className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap text-[var(--foreground)]/90">
        {bookmark.text}
      </p>

      <div className="flex gap-4 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {bookmark.public_metrics.like_count}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {bookmark.public_metrics.retweet_count}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {bookmark.public_metrics.reply_count}
        </span>
        <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}
