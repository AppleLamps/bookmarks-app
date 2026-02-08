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
      className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        {bookmark.author && (
          <>
            <span className="font-medium text-sm">{bookmark.author.name}</span>
            <span className="text-sm text-gray-500">@{bookmark.author.username}</span>
          </>
        )}
        <span className="text-sm text-gray-400 ml-auto">{date}</span>
      </div>

      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {bookmark.text}
      </p>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>{bookmark.public_metrics.like_count} likes</span>
        <span>{bookmark.public_metrics.retweet_count} retweets</span>
        <span>{bookmark.public_metrics.reply_count} replies</span>
      </div>
    </a>
  );
}
