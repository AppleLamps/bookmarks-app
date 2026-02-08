"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Bookmark, BookmarkFolder, BookmarksResponse } from "@/types";
import BookmarkCard from "./BookmarkCard";
import DownloadButton from "./DownloadButton";
import FetchMoreButton from "./BuyMoreButton";

interface BookmarkListProps {
  username: string;
}

export default function BookmarkList({ username }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [moreFetched, setMoreFetched] = useState(0);

  // Folders state
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = "All"
  const [folderMemberships, setFolderMemberships] = useState<Record<string, string[]>>({}); // folderId -> postIds
  const [folderMembershipErrors, setFolderMembershipErrors] = useState<Record<string, string>>({});
  const [postFolderMap, setPostFolderMap] = useState<Map<string, string[]>>(new Map()); // postId -> folderNames
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFolderId, setLoadingFolderId] = useState<string | null>(null);

  // Search state
  const [search, setSearch] = useState("");

  const fetchBookmarks = useCallback(async (type: "free" | "more") => {
    setError(null);

    if (type === "more") {
      setFetchingMore(true);
      setMoreFetched(0);
      try {
        const res = await fetch(`/api/bookmarks?type=more`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch bookmarks");
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Streaming not supported");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.type === "progress") {
              setMoreFetched(event.fetched);
            } else if (event.type === "complete") {
              setBookmarks((prev) => [...prev, ...event.bookmarks]);
              setHasMore(event.hasMore);
              setTotalFetched(event.totalFetched);
            } else if (event.type === "error") {
              throw new Error(event.error);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setFetchingMore(false);
        setMoreFetched(0);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bookmarks?type=${type}`);
      const data: BookmarksResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch bookmarks");
      }

      setBookmarks((prev) => [...prev, ...data.bookmarks]);
      setHasMore(data.hasMore);
      setTotalFetched(data.totalFetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFolderMembers = useCallback(async (folderId: string, folderName: string) => {
    setLoadingFolderId(folderId);
    setFolderMembershipErrors((prev) => {
      if (!prev[folderId]) return prev;
      const { [folderId]: _, ...rest } = prev;
      return rest;
    });

    try {
      const res = await fetch(`/api/folders?folderId=${encodeURIComponent(folderId)}`);
      const data: { postIds?: string[]; tweets?: Bookmark[]; error?: string } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch folder contents");
      }

      const postIds = data.postIds || [];
      setFolderMemberships((prev) => ({ ...prev, [folderId]: postIds }));

      // Merge any tweets from the folder that aren't already in our local list
      if (data.tweets && data.tweets.length > 0) {
        setBookmarks((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newTweets = data.tweets!.filter((t) => !existingIds.has(t.id));
          return newTweets.length > 0 ? [...prev, ...newTweets] : prev;
        });
      }

      // Incrementally update reverse map: postId -> folder names
      setPostFolderMap((prev) => {
        const next = new Map(prev);
        for (const postId of postIds) {
          const existing = next.get(postId) || [];
          if (!existing.includes(folderName)) {
            next.set(postId, [...existing, folderName]);
          }
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch folder contents";
      setFolderMemberships((prev) => ({ ...prev, [folderId]: [] }));
      setFolderMembershipErrors((prev) => ({ ...prev, [folderId]: message }));
    } finally {
      setLoadingFolderId((cur) => (cur === folderId ? null : cur));
    }
  }, []);

  // Fetch folders on mount (memberships are loaded lazily per-folder to avoid 429 bursts)
  useEffect(() => {
    async function loadFolders() {
      setLoadingFolders(true);
      try {
        const res = await fetch("/api/folders");
        if (res.ok) {
          const data = await res.json();
          const loadedFolders: BookmarkFolder[] = data.folders || [];
          setFolders(loadedFolders);
        }
      } catch {
        // Folders are optional; silently ignore
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, []);

  // When selecting a folder, fetch its membership if we don't have it yet (or if it previously errored)
  useEffect(() => {
    if (!selectedFolder) return;
    if (folderMemberships[selectedFolder] && !folderMembershipErrors[selectedFolder]) return;

    const folder = folders.find((f) => f.id === selectedFolder);
    if (!folder) return;

    loadFolderMembers(folder.id, folder.name);
  }, [selectedFolder, folderMemberships, folderMembershipErrors, folders, loadFolderMembers]);

  // Initial load: fetch free bookmarks
  useEffect(() => {
    fetchBookmarks("free");
  }, [fetchBookmarks]);

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // If a folder is selected but the membership hasn't been loaded yet, don't show misleading results.
    if (selectedFolder && folderMemberships[selectedFolder] === undefined) {
      return [];
    }

    if (selectedFolder && folderMemberships[selectedFolder]) {
      const folderPostIds = new Set(folderMemberships[selectedFolder]);
      result = result.filter((b) => folderPostIds.has(b.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.text.toLowerCase().includes(q) ||
          b.author?.name.toLowerCase().includes(q) ||
          b.author?.username.toLowerCase().includes(q)
      );
    }

    return result;
  }, [bookmarks, selectedFolder, folderMemberships, search]);

  const canFetchMore = hasMore && !loading;
  const folderFilterLoading = !!selectedFolder
    && folderMemberships[selectedFolder] === undefined
    && loadingFolderId === selectedFolder;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your Bookmarks</h2>
          {totalFetched > 0 && (
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              {totalFetched} bookmark{totalFetched !== 1 ? "s" : ""} loaded
              {filteredBookmarks.length !== bookmarks.length && ` · ${filteredBookmarks.length} shown`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DownloadButton bookmarks={filteredBookmarks} username={username} />
          {(canFetchMore || fetchingMore) && (
            <FetchMoreButton
              onClick={() => fetchBookmarks("more")}
              loading={fetchingMore}
              fetchedCount={moreFetched}
            />
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Folder tabs */}
      {folders.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${!selectedFolder
              ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
              : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            All
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                const nextSelected = folder.id === selectedFolder ? null : folder.id;
                setSelectedFolder(nextSelected);

                if (nextSelected) {
                  const hasMembership = folderMemberships[nextSelected] !== undefined
                    && !folderMembershipErrors[nextSelected];
                  if (!hasMembership) {
                    setLoadingFolderId(nextSelected);
                  }
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${selectedFolder === folder.id
                ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {folder.name}
                {loadingFolderId === folder.id && (
                  <svg className="w-3 h-3 animate-spin text-[var(--muted)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </span>
            </button>
          ))}
          {loadingFolders && (
            <svg className="w-3.5 h-3.5 animate-spin text-[var(--muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
      )}

      {selectedFolder && folderMembershipErrors[selectedFolder] && (
        <div className="animate-fade-in-scale mb-6 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3">
          <span>{folderMembershipErrors[selectedFolder]}</span>
          <button
            onClick={() => {
              const folder = folders.find((f) => f.id === selectedFolder);
              if (folder) loadFolderMembers(folder.id, folder.name);
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200/70 dark:border-amber-900/50 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {error && (
        <div className="animate-fade-in-scale mb-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {filteredBookmarks.map((bookmark, i) => (
          <div key={bookmark.id} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }} className="animate-fade-in">
            <BookmarkCard bookmark={bookmark} folderNames={postFolderMap.get(bookmark.id)} />
          </div>
        ))}
      </div>

      {folderFilterLoading && (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading folder...
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading bookmarks...
          </div>
        </div>
      )}

      {!loading && !folderFilterLoading && filteredBookmarks.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--muted)]">
            {search || selectedFolder ? "No bookmarks match your filter." : "No bookmarks found."}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1 opacity-60">
            {search || selectedFolder ? "Try a different search or folder." : "Start bookmarking posts on X!"}
          </p>
        </div>
      )}

      {!loading && !hasMore && filteredBookmarks.length > 0 && !selectedFolder && (
        <div className="text-center py-10 text-xs text-[var(--muted)] opacity-60">
          All bookmarks loaded
        </div>
      )}
    </div>
  );
}
