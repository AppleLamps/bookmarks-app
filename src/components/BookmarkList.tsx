"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Bookmark, BookmarkFolder, BookmarksResponse, FoldersResponse } from "@/types";
import BookmarkCard from "./BookmarkCard";
import DownloadButton from "./DownloadButton";
import BuyMoreButton from "./BuyMoreButton";

interface BookmarkListProps {
  username: string;
  paymentStatus?: string | null;
}

export default function BookmarkList({ username, paymentStatus }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);
  const [paidBatches, setPaidBatches] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Folders state
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = "All"
  const [folderPostIds, setFolderPostIds] = useState<Set<string> | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFolderPosts, setLoadingFolderPosts] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  const fetchBookmarks = useCallback(async (type: "free" | "paid") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookmarks?type=${type}`);
      const data: BookmarksResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch bookmarks");
      }

      setBookmarks((prev) => [...prev, ...data.bookmarks]);
      setHasMore(data.hasMore);
      setTotalFetched(data.totalFetched);
      setPaidBatches(data.paidBatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch folders on mount
  useEffect(() => {
    async function loadFolders() {
      setLoadingFolders(true);
      try {
        const res = await fetch("/api/folders");
        if (res.ok) {
          const data: FoldersResponse = await res.json();
          setFolders(data.folders || []);
        }
      } catch {
        // Folders are optional; silently ignore
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, []);

  // Initial load: fetch free bookmarks
  useEffect(() => {
    fetchBookmarks("free").then(() => setInitialLoadDone(true));
  }, [fetchBookmarks]);

  // After payment success, fetch paid bookmarks
  useEffect(() => {
    if (paymentStatus === "success" && initialLoadDone) {
      fetchBookmarks("paid");
    }
  }, [paymentStatus, initialLoadDone, fetchBookmarks]);

  // Fetch post IDs when a folder is selected
  useEffect(() => {
    if (!selectedFolder) {
      setFolderPostIds(null);
      return;
    }
    async function loadFolderPosts() {
      setLoadingFolderPosts(true);
      try {
        const res = await fetch(`/api/folders?folderId=${selectedFolder}`);
        if (res.ok) {
          const data = await res.json();
          setFolderPostIds(new Set(data.postIds || []));
        }
      } catch {
        setFolderPostIds(null);
      } finally {
        setLoadingFolderPosts(false);
      }
    }
    loadFolderPosts();
  }, [selectedFolder]);

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (folderPostIds) {
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
  }, [bookmarks, folderPostIds, search]);

  const canBuyMore = hasMore && !loading;

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
          {canBuyMore && <BuyMoreButton />}
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
              onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${selectedFolder === folder.id
                  ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {folder.name}
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

      {error && (
        <div className="animate-fade-in-scale mb-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {paymentStatus === "cancelled" && (
        <div className="animate-fade-in-scale mb-6 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl text-sm border border-amber-200 dark:border-amber-900/50">
          Payment was cancelled. You can try again anytime.
        </div>
      )}

      {loadingFolderPosts && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading folder...
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredBookmarks.map((bookmark, i) => (
          <div key={bookmark.id} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }} className="animate-fade-in">
            <BookmarkCard bookmark={bookmark} />
          </div>
        ))}
      </div>

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

      {!loading && !loadingFolderPosts && filteredBookmarks.length === 0 && !error && (
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
