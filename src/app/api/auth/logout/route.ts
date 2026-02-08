import { NextResponse } from "next/server";
import { getSession, deleteSessionCookie } from "@/lib/session";
import { getUserData, deleteUserData } from "@/lib/kv";
import { revokeToken } from "@/lib/oauth";

export async function POST() {
  const session = await getSession();

  if (session) {
    try {
      const userData = await getUserData(session.xUserId);
      if (userData) {
        await revokeToken(userData.accessToken);
      }
      await deleteUserData(session.xUserId);
    } catch (err) {
      console.error("Error revoking token:", err);
    }
  }

  await deleteSessionCookie();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return NextResponse.redirect(baseUrl, { status: 303 });
}
