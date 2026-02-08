import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier, generateCodeChallenge, buildAuthorizeUrl } from "@/lib/oauth";
import { setOAuthStateCookie } from "@/lib/session";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  await setOAuthStateCookie(state, codeVerifier);

  const authorizeUrl = buildAuthorizeUrl(state, codeChallenge);
  return NextResponse.redirect(authorizeUrl);
}
