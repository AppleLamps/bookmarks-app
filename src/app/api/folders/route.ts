import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData } from "@/lib/kv";
import { ensureValidToken, fetchBookmarkFolders, fetchFolderPostIds, fetchTweetsByIds } from "@/lib/x-api";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userData = await getUserData(session.xUserId);
  if (!userData) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const folderId = request.nextUrl.searchParams.get("folderId");
  const includeMembers = request.nextUrl.searchParams.get("includeMembers") === "true";

  try {
    userData = await ensureValidToken(userData, session.xUserId);

    // Single folder: get post IDs and then fetch full tweet data
    if (folderId) {
      const postIds = await fetchFolderPostIds(userData.accessToken, session.xUserId, folderId);
      const tweets = await fetchTweetsByIds(userData.accessToken, postIds);
      return NextResponse.json({ postIds, tweets });
    }

    const folders = await fetchBookmarkFolders(userData.accessToken, session.xUserId);

    // If includeMembers, also fetch post IDs for each folder.
    // Note: avoid blasting X with a burst of concurrent requests (easy to 429).
    if (includeMembers && folders.length > 0) {
      const memberships: Record<string, string[]> = {};
      const membershipErrors: Record<string, string> = {};

      for (const folder of folders) {
        try {
          const postIds = await fetchFolderPostIds(userData.accessToken, session.xUserId, folder.id);
          memberships[folder.id] = postIds;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to fetch folder contents";
          memberships[folder.id] = [];
          membershipErrors[folder.id] = message;
          console.warn("Folder membership fetch failed:", folder.id, message);

          // Very small backoff helps if we hit transient 429s.
          if (message.toLowerCase().includes("rate limit")) {
            await sleep(300);
          }
        }
      }

      return NextResponse.json({ folders, memberships, membershipErrors });
    }

    return NextResponse.json({ folders });
  } catch (err) {
    console.error("Folder fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
