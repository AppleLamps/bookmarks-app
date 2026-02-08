import { Bookmark, TweetEntity } from "@/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

function renderTextWithEntities(text: string, entities?: TweetEntity) {
  if (!entities) {
    // Fallback: basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        const cleaned = part.replace(/[).,;:!?]+$/, "");
        const trailing = part.slice(cleaned.length);
        return (
          <span key={i}>
            <a href={cleaned} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
              {cleaned.replace(/^https?:\/\//, "").slice(0, 40)}{cleaned.replace(/^https?:\/\//, "").length > 40 ? "…" : ""}
            </a>{trailing}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  // Build sorted replacements from entities
  type Replacement = { start: number; end: number; render: () => React.ReactNode };
  const replacements: Replacement[] = [];

  entities.urls?.forEach((u) => {
    replacements.push({
      start: u.start,
      end: u.end,
      render: () => (
        <a href={u.expanded_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline" title={u.expanded_url}>
          {u.display_url}
        </a>
      ),
    });
  });

  entities.mentions?.forEach((m) => {
    replacements.push({
      start: m.start,
      end: m.end,
      render: () => (
        <a href={`https://x.com/${m.username}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          @{m.username}
        </a>
      ),
    });
  });

  entities.hashtags?.forEach((h) => {
    replacements.push({
      start: h.start,
      end: h.end,
      render: () => (
        <a href={`https://x.com/hashtag/${h.tag}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          #{h.tag}
        </a>
      ),
    });
  });

  entities.cashtags?.forEach((c) => {
    replacements.push({
      start: c.start,
      end: c.end,
      render: () => (
        <a href={`https://x.com/search?q=%24${c.tag}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          ${c.tag}
        </a>
      ),
    });
  });

  replacements.sort((a, b) => a.start - b.start);

  const result: React.ReactNode[] = [];
  let cursor = 0;
  // Use Array.from to correctly handle multi-byte characters
  const chars = Array.from(text);

  replacements.forEach((r, i) => {
    if (r.start > cursor) {
      result.push(<span key={`t${i}`}>{chars.slice(cursor, r.start).join("")}</span>);
    }
    result.push(<span key={`r${i}`}>{r.render()}</span>);
    cursor = r.end;
  });

  if (cursor < chars.length) {
    result.push(<span key="tail">{chars.slice(cursor).join("")}</span>);
  }

  return result;
}

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", ja: "Japanese",
  ko: "Korean", pt: "Portuguese", it: "Italian", nl: "Dutch", ru: "Russian",
  ar: "Arabic", hi: "Hindi", zh: "Chinese", tr: "Turkish", pl: "Polish",
  sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", th: "Thai",
  id: "Indonesian", tl: "Filipino", uk: "Ukrainian", cs: "Czech", ro: "Romanian",
  und: "Undetermined", qme: "Media only", qst: "Short text", zxx: "No language",
};

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const date = new Date(bookmark.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const tweetUrl = bookmark.author
    ? `https://x.com/${bookmark.author.username}/status/${bookmark.id}`
    : `https://x.com/i/status/${bookmark.id}`;

  const refType = bookmark.referenced_tweets?.[0]?.type;

  return (
    <div className="group block p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
      {/* Referenced tweet badge */}
      {refType && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] mb-2">
          {refType === "retweeted" && (
            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Retweet</>
          )}
          {refType === "quoted" && (
            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> Quote</>
          )}
          {refType === "replied_to" && (
            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Reply</>
          )}
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        {bookmark.author && (
          <>
            {bookmark.author.profile_image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={bookmark.author.profile_image_url}
                alt={bookmark.author.name}
                className="w-5 h-5 rounded-full flex-shrink-0"
              />
            )}
            <span className="font-medium text-sm truncate">{bookmark.author.name}</span>
            <span className="text-xs text-[var(--muted)] truncate">@{bookmark.author.username}</span>
            {bookmark.author.verified && (
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" /></svg>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {bookmark.lang && bookmark.lang !== "en" && bookmark.lang !== "und" && bookmark.lang !== "qme" && bookmark.lang !== "qst" && bookmark.lang !== "zxx" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]" title={LANG_NAMES[bookmark.lang] || bookmark.lang}>
              {bookmark.lang.toUpperCase()}
            </span>
          )}
          <span className="text-xs text-[var(--muted)] tabular-nums">{date}</span>
        </div>
      </div>

      {/* Tweet text with entities */}
      <p className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap text-[var(--foreground)]/90">
        {renderTextWithEntities(bookmark.text, bookmark.entities)}
      </p>

      {/* Media grid */}
      {bookmark.media && bookmark.media.length > 0 && (
        <div className={`mb-3 grid gap-1 rounded-xl overflow-hidden ${bookmark.media.length === 1 ? "grid-cols-1" :
          bookmark.media.length === 2 ? "grid-cols-2" :
            bookmark.media.length === 3 ? "grid-cols-2" :
              "grid-cols-2"
          }`}>
          {bookmark.media.map((m, i) => {
            const isVideo = m.type === "video" || m.type === "animated_gif";
            const imgUrl = m.type === "photo" ? m.url : m.preview_image_url;
            if (!imgUrl) return null;

            return (
              <div key={m.media_key} className={`relative bg-[var(--background)] ${bookmark.media!.length === 3 && i === 0 ? "row-span-2" : ""
                }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={m.alt_text || "Media"}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: bookmark.media!.length === 1 ? "320px" : "160px" }}
                  loading="lazy"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                )}
                {m.type === "animated_gif" && (
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1 py-0.5 rounded">GIF</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quoted tweet embed */}
      {bookmark.quoted_tweet && (
        <a
          href={bookmark.quoted_tweet.author
            ? `https://x.com/${bookmark.quoted_tweet.author.username}/status/${bookmark.quoted_tweet.id}`
            : `https://x.com/i/status/${bookmark.quoted_tweet.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {bookmark.quoted_tweet.author && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {bookmark.quoted_tweet.author.profile_image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={bookmark.quoted_tweet.author.profile_image_url} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="font-medium text-xs truncate">{bookmark.quoted_tweet.author.name}</span>
              <span className="text-[11px] text-[var(--muted)] truncate">@{bookmark.quoted_tweet.author.username}</span>
            </div>
          )}
          <p className="text-xs leading-relaxed text-[var(--foreground)]/80 whitespace-pre-wrap line-clamp-4">
            {renderTextWithEntities(bookmark.quoted_tweet.text, bookmark.quoted_tweet.entities)}
          </p>
          {bookmark.quoted_tweet.media && bookmark.quoted_tweet.media.length > 0 && (() => {
            const qm = bookmark.quoted_tweet!.media![0];
            const qmUrl = qm.type === "photo" ? qm.url : qm.preview_image_url;
            return qmUrl ? (
              <div className="mt-2 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qmUrl} alt={qm.alt_text || ""} className="w-full object-cover" style={{ maxHeight: "160px" }} loading="lazy" />
              </div>
            ) : null;
          })()}
        </a>
      )}

      {/* Metrics row */}
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
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
        >
          <span className="text-[10px]">View on X</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
