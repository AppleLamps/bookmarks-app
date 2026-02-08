import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData, setUserData, getCachedBookmarks, appendCachedBookmarks } from "@/lib/kv";
import { ensureValidToken, fetchBookmarks, mergeBookmarksWithAuthors } from "@/lib/x-api";
import { Bookmark } from "@/types";

const PAID_BATCH_SIZE = 500;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  if (typeParam !== null && typeParam !== "free" && typeParam !== "paid") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const type: "free" | "paid" = (typeParam ?? "free") as "free" | "paid";

  let userData = await getUserData(session.xUserId);
  if (!userData) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  // For paid fetches, check that the user has available batches
  if (type === "paid") {
    const paidFetchesUsed = userData.totalFetched > 25
      ? Math.ceil((userData.totalFetched - 25) / PAID_BATCH_SIZE)
      : 0;
    if (paidFetchesUsed >= userData.paidBatches) {
      return NextResponse.json({ error: "No paid batches available. Purchase more." }, { status: 402 });
    }
  }

  // FREE: If bookmarks were already fetched (and not refreshing), return cached data
  if (type === "free" && userData.totalFetched > 0) {
    const cached = await getCachedBookmarks(session.xUserId);
    return NextResponse.json({
      bookmarks: cached,
      hasMore: userData.nextToken !== null,
      totalFetched: userData.totalFetched,
      paidBatches: userData.paidBatches,
    });
  }

  // Check if there are no more bookmarks to fetch
  if (userData.totalFetched > 0 && userData.nextToken === null) {
    return NextResponse.json({
      bookmarks: [],
      hasMore: false,
      totalFetched: userData.totalFetched,
      paidBatches: userData.paidBatches,
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
        paidBatches: userData.paidBatches,
      });
    }

    // Paid: loop up to 20 API calls (25 each) to get 500 bookmarks
    // NOTE: We use max_results=25 because the X API has a bug where
    // large page sizes (e.g. 100) cause pagination to cut off prematurely,
    // returning far fewer results than actually available.
    const allBookmarks: Bookmark[] = [];
    let remaining = PAID_BATCH_SIZE;
    let hasMore = true;
    const MAX_PAID_API_CALLS = 20;
    let calls = 0;

    while (remaining > 0 && hasMore && calls < MAX_PAID_API_CALLS) {
      calls += 1;
      const maxResults = Math.min(remaining, 25);
      const apiResponse = await fetchBookmarks(
        userData.accessToken,
        session.xUserId,
        maxResults,
        userData.nextToken
      );

      const bookmarks = mergeBookmarksWithAuthors(apiResponse);
      allBookmarks.push(...bookmarks);

      const resultCount = apiResponse.meta.result_count ?? 0;
      userData.nextToken = apiResponse.meta.next_token || null;
      userData.totalFetched += resultCount;
      remaining -= resultCount;
      hasMore = !!apiResponse.meta.next_token;

      // Avoid spinning if the API returns empty pages while still providing a next token.
      if (resultCount === 0) {
        break;
      }

      // Small delay between calls to avoid hitting rate limits
      if (remaining > 0 && hasMore) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    await setUserData(session.xUserId, userData);
    await appendCachedBookmarks(session.xUserId, allBookmarks);

    return NextResponse.json({
      bookmarks: allBookmarks,
      hasMore,
      totalFetched: userData.totalFetched,
      paidBatches: userData.paidBatches,
    });
  } catch (err) {
    console.error("Bookmark fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
