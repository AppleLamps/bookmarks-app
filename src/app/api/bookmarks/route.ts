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

  const type = request.nextUrl.searchParams.get("type") || "free";

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

    // Paid: loop up to 5 API calls (100 each) to get 500 bookmarks
    const allBookmarks: Bookmark[] = [];
    let remaining = PAID_BATCH_SIZE;
    let hasMore = true;

    while (remaining > 0 && hasMore) {
      const maxResults = Math.min(remaining, 100);
      const apiResponse = await fetchBookmarks(
        userData.accessToken,
        session.xUserId,
        maxResults,
        userData.nextToken
      );

      const bookmarks = mergeBookmarksWithAuthors(apiResponse);
      allBookmarks.push(...bookmarks);

      userData.nextToken = apiResponse.meta.next_token || null;
      userData.totalFetched += apiResponse.meta.result_count;
      remaining -= apiResponse.meta.result_count;
      hasMore = !!apiResponse.meta.next_token;
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
