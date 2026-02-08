import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData, setUserData } from "@/lib/kv";
import { ensureValidToken, fetchBookmarks, mergeBookmarksWithAuthors } from "@/lib/x-api";

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
      ? Math.ceil((userData.totalFetched - 25) / 100)
      : 0;
    if (paidFetchesUsed >= userData.paidBatches) {
      return NextResponse.json({ error: "No paid batches available. Purchase more." }, { status: 402 });
    }
  }

  // Check if there are more bookmarks to fetch
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

    const maxResults = type === "free" ? 25 : 100;
    const apiResponse = await fetchBookmarks(
      userData.accessToken,
      session.xUserId,
      maxResults,
      userData.nextToken
    );

    const bookmarks = mergeBookmarksWithAuthors(apiResponse);

    // Update KV state
    userData.nextToken = apiResponse.meta.next_token || null;
    userData.totalFetched += apiResponse.meta.result_count;
    await setUserData(session.xUserId, userData);

    return NextResponse.json({
      bookmarks,
      hasMore: !!apiResponse.meta.next_token,
      totalFetched: userData.totalFetched,
      paidBatches: userData.paidBatches,
    });
  } catch (err) {
    console.error("Bookmark fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
