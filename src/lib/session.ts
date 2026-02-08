import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { SessionPayload } from "@/types";

// A256GCM requires exactly 32 bytes — hash whatever secret is provided to guarantee that
const SECRET = createHash("sha256")
  .update(process.env.SESSION_SECRET || "fallback-secret-change-in-production!!")
  .digest();

const COOKIE_NAME = "bm_session";
const OAUTH_COOKIE_NAME = "oauth_state";

export async function encrypt(payload: Record<string, unknown>): Promise<string> {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(SECRET);
}

export async function decrypt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtDecrypt(token, SECRET);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await decrypt(token);
  if (!payload) return null;
  return payload as unknown as SessionPayload;
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload as unknown as Record<string, unknown>);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function setOAuthStateCookie(state: string, codeVerifier: string): Promise<void> {
  const token = await encrypt({ state, codeVerifier });
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });
}

export async function getOAuthStateCookie(): Promise<{ state: string; codeVerifier: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OAUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await decrypt(token);
  if (!payload) return null;
  return { state: payload.state as string, codeVerifier: payload.codeVerifier as string };
}

export async function deleteOAuthStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_COOKIE_NAME);
}
