"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarksResponse } from "@/types";
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

  const paidFetchesUsed = totalFetched > 25 ? Math.ceil((totalFetched - 25) / 100) : 0;
  const canBuyMore = hasMore && !loading;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Your Bookmarks</h2>
          {totalFetched > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {totalFetched} bookmark{totalFetched !== 1 ? "s" : ""} loaded
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <DownloadButton bookmarks={bookmarks} username={username} />
          {canBuyMore && <BuyMoreButton />}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {paymentStatus === "cancelled" && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
          Payment was cancelled. You can try again anytime.
        </div>
      )}

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {!loading && bookmarks.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          No bookmarks found. Start bookmarking posts on X!
        </div>
      )}

      {!loading && !hasMore && bookmarks.length > 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          All bookmarks loaded.
        </div>
      )}
    </div>
  );
}
