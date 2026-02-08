import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData } from "@/lib/kv";
import { ensureValidToken, fetchBookmarkFolders, fetchFolderPostIds } from "@/lib/x-api";

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

        // Single folder post IDs
        if (folderId) {
            const postIds = await fetchFolderPostIds(userData.accessToken, session.xUserId, folderId);
            return NextResponse.json({ postIds });
        }

        const folders = await fetchBookmarkFolders(userData.accessToken, session.xUserId);

        // If includeMembers, also fetch post IDs for each folder
        if (includeMembers && folders.length > 0) {
            const memberships: Record<string, string[]> = {};
            await Promise.all(
                folders.map(async (folder) => {
                    try {
                        const postIds = await fetchFolderPostIds(userData!.accessToken, session!.xUserId, folder.id);
                        memberships[folder.id] = postIds;
                    } catch {
                        memberships[folder.id] = [];
                    }
                })
            );
            return NextResponse.json({ folders, memberships });
        }

        return NextResponse.json({ folders });
    } catch (err) {
        console.error("Folder fetch error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch folders";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
