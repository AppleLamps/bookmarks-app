"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";

export default function BookmarkViewer() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File) => {
        setError(null);
        setFileName(file.name);

        if (!file.name.endsWith(".json")) {
            setError("Please upload a JSON file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const raw = JSON.parse(e.target?.result as string);

                // Support both array format and { bookmarks: [...] } format
                const items: Bookmark[] = Array.isArray(raw)
                    ? raw
                    : raw.bookmarks
                        ? raw.bookmarks
                        : raw.data
                            ? raw.data
                            : [];

                if (items.length === 0) {
                    setError("No bookmarks found in this file. Make sure you're uploading a valid bookmarks JSON export.");
                    return;
                }

                setBookmarks(items);
            } catch {
                setError("Invalid JSON file. Please check the file format.");
            }
        };
        reader.readAsText(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleClear = () => {
        setBookmarks([]);
        setFileName(null);
        setError(null);
        setSearchQuery("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const filtered = searchQuery
        ? bookmarks.filter(
            (b) =>
                b.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.author?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : bookmarks;

    // Upload state
    if (bookmarks.length === 0) {
        return (
            <div className="max-w-xl mx-auto px-6 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-semibold tracking-tight mb-2">View Bookmarks</h2>
                    <p className="text-sm text-[var(--muted)]">
                        Upload a previously exported JSON file to browse your bookmarks.
                    </p>
                </div>

                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200
            ${isDragging
                            ? "border-[var(--accent)] bg-[var(--surface-hover)] scale-[1.01]"
                            : "border-[var(--border)] hover:border-gray-400 dark:hover:border-gray-600 hover:bg-[var(--surface)]"
                        }
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">
                                Drop your JSON file here, or{" "}
                                <span className="text-[var(--accent)] underline underline-offset-2">browse</span>
                            </p>
                            <p className="text-xs text-[var(--muted)]">Supports exports from this app</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="animate-fade-in-scale mt-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        &larr; Back to home
                    </Link>
                </div>
            </div>
        );
    }

    // Viewer state
    return (
        <div className="max-w-2xl mx-auto px-6 py-8">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Your Bookmarks</h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                        {fileName} &middot; {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-all"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {searchQuery && (
                <p className="text-xs text-[var(--muted)] mb-4">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                </p>
            )}

            {/* Bookmark list */}
            <div className="space-y-2">
                {filtered.map((bookmark, i) => (
                    <div key={bookmark.id} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }} className="animate-fade-in">
                        <BookmarkCard bookmark={bookmark} />
                    </div>
                ))}
            </div>

            {filtered.length === 0 && searchQuery && (
                <div className="text-center py-16">
                    <p className="text-sm text-[var(--muted)]">No bookmarks match your search.</p>
                </div>
            )}
        </div>
    );
}
