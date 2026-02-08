import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/oauth";
import { fetchUserProfile } from "@/lib/x-api";
import { getOAuthStateCookie, deleteOAuthStateCookie, setSessionCookie } from "@/lib/session";
import { setUserData } from "@/lib/kv";
import { UserKVData, SessionPayload } from "@/types";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_params`);
  }

  const oauthState = await getOAuthStateCookie();
  if (!oauthState || oauthState.state !== state) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
  }

  await deleteOAuthStateCookie();

  try {
    const tokens = await exchangeCodeForTokens(code, oauthState.codeVerifier);
    const profile = await fetchUserProfile(tokens.access_token);

    const userData: UserKVData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: Date.now() + tokens.expires_in * 1000,
      username: profile.username,
      name: profile.name,
      profileImageUrl: profile.profile_image_url,
      nextToken: null,
      totalFetched: 0,
    };

    await setUserData(profile.id, userData);

    const sessionPayload: SessionPayload = {
      xUserId: profile.id,
      username: profile.username,
      profileImageUrl: profile.profile_image_url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }
}
