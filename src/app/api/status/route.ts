import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserData } from "@/lib/kv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await getUserData(session.xUserId);
  if (!userData) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    totalFetched: userData.totalFetched,
    hasMore: userData.nextToken !== null,
  });
}
