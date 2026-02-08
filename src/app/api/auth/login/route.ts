import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier, generateCodeChallenge, buildAuthorizeUrl } from "@/lib/oauth";
import { setOAuthStateCookie } from "@/lib/session";

export async function GET() {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    await setOAuthStateCookie(state, codeVerifier);

    const authorizeUrl = buildAuthorizeUrl(state, codeChallenge);
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    console.error("Login route error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }
}
