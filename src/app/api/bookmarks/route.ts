import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData, setUserData, getCachedBookmarks, appendCachedBookmarks } from "@/lib/kv";
import { ensureValidToken, fetchBookmarks, mergeBookmarksWithAuthors } from "@/lib/x-api";
import { Bookmark } from "@/types";

const MORE_BATCH_SIZE = 500;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  if (typeParam !== null && typeParam !== "free" && typeParam !== "more") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const type: "free" | "more" = (typeParam ?? "free") as "free" | "more";

  let userData = await getUserData(session.xUserId);
  if (!userData) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  // FREE: If bookmarks were already fetched (and not refreshing), return cached data
  if (type === "free" && userData.totalFetched > 0) {
    const cached = await getCachedBookmarks(session.xUserId);
    return NextResponse.json({
      bookmarks: cached,
      hasMore: userData.nextToken !== null,
      totalFetched: userData.totalFetched,
    });
  }

  // Check if there are no more bookmarks to fetch
  if (userData.totalFetched > 0 && userData.nextToken === null) {
    return NextResponse.json({
      bookmarks: [],
      hasMore: false,
      totalFetched: userData.totalFetched,
    });
  }

  try {
    userData = await ensureValidToken(userData, session.xUserId);

    if (type === "free") {
      // Single fetch of 25
      const apiResponse = await fetchBookmarks(
        userData.accessToken,
        session.xUserId,
        25,
        userData.nextToken
      );

      const bookmarks = mergeBookmarksWithAuthors(apiResponse);
      userData.nextToken = apiResponse.meta.next_token || null;
      userData.totalFetched += apiResponse.meta.result_count;
      await setUserData(session.xUserId, userData);
      await appendCachedBookmarks(session.xUserId, bookmarks);

      return NextResponse.json({
        bookmarks,
        hasMore: !!apiResponse.meta.next_token,
        totalFetched: userData.totalFetched,
      });
    }

    // More: loop up to 20 API calls (25 each) to get 500 bookmarks
    // NOTE: We use max_results=25 because the X API has a bug where
    // large page sizes (e.g. 100) cause pagination to cut off prematurely,
    // returning far fewer results than actually available.
    // Stream progress back to the client as NDJSON so the UI can show a live count.
    const encoder = new TextEncoder();
    const xUserId = session.xUserId;
    let ud = userData;

    const stream = new ReadableStream({
      async start(controller) {
        const allBookmarks: Bookmark[] = [];
        let remaining = MORE_BATCH_SIZE;
        let hasMore = true;
        const MAX_API_CALLS = 20;
        let calls = 0;
        let batchFetched = 0;

        try {
          while (remaining > 0 && hasMore && calls < MAX_API_CALLS) {
            calls += 1;
            const maxResults = Math.min(remaining, 25);
            const apiResponse = await fetchBookmarks(
              ud.accessToken,
              xUserId,
              maxResults,
              ud.nextToken
            );

            const bookmarks = mergeBookmarksWithAuthors(apiResponse);
            allBookmarks.push(...bookmarks);

            const resultCount = apiResponse.meta.result_count ?? 0;
            ud.nextToken = apiResponse.meta.next_token || null;
            ud.totalFetched += resultCount;
            remaining -= resultCount;
            batchFetched += resultCount;
            hasMore = !!apiResponse.meta.next_token;

            // Send progress event
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "progress", fetched: batchFetched, target: MORE_BATCH_SIZE }) + "\n"
              )
            );

            if (resultCount === 0) {
              break;
            }

            if (remaining > 0 && hasMore) {
              await new Promise((r) => setTimeout(r, 250));
            }
          }

          await setUserData(xUserId, ud);
          await appendCachedBookmarks(xUserId, allBookmarks);

          // Send final result
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                bookmarks: allBookmarks,
                hasMore,
                totalFetched: ud.totalFetched,
              }) + "\n"
            )
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to fetch bookmarks";
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error", error: message }) + "\n")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Bookmark fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
