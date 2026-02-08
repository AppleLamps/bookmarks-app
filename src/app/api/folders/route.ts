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

    try {
        userData = await ensureValidToken(userData, session.xUserId);

        if (folderId) {
            const postIds = await fetchFolderPostIds(userData.accessToken, session.xUserId, folderId);
            return NextResponse.json({ postIds });
        }

        const folders = await fetchBookmarkFolders(userData.accessToken, session.xUserId);
        return NextResponse.json({ folders });
    } catch (err) {
        console.error("Folder fetch error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch folders";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
