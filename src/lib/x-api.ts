import { refreshAccessToken } from "./oauth";
import { getUserData, setUserData } from "./kv";
import { Bookmark, UserKVData, XApiBookmarksResponse } from "@/types";

export async function ensureValidToken(userData: UserKVData, xUserId: string): Promise<UserKVData> {
  if (userData.tokenExpiresAt > Date.now() + 60_000) {
    return userData;
  }

  const tokens = await refreshAccessToken(userData.refreshToken);
  const updated: UserKVData = {
    ...userData,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: Date.now() + tokens.expires_in * 1000,
  };
  await setUserData(xUserId, updated);
  return updated;
}

export async function fetchBookmarks(
  accessToken: string,
  userId: string,
  maxResults: number,
  paginationToken?: string | null
): Promise<XApiBookmarksResponse> {
  const params = new URLSearchParams({
    max_results: String(maxResults),
    "tweet.fields": "created_at,public_metrics,author_id",
    expansions: "author_id",
    "user.fields": "username,name,verified",
  });

  if (paginationToken) {
    params.set("pagination_token", paginationToken);
  }

  const response = await fetch(
    `https://api.x.com/2/users/${userId}/bookmarks?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 429) {
    throw new Error("Rate limited by X API. Please wait a few minutes and try again.");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch bookmarks: ${error}`);
  }

  return response.json();
}

export function mergeBookmarksWithAuthors(apiResponse: XApiBookmarksResponse): Bookmark[] {
  const usersMap = new Map<string, { id: string; username: string; name: string; verified: boolean }>();
  if (apiResponse.includes?.users) {
    for (const user of apiResponse.includes.users) {
      usersMap.set(user.id, user);
    }
  }

  return (apiResponse.data || []).map((tweet) => ({
    id: tweet.id,
    text: tweet.text,
    created_at: tweet.created_at,
    author_id: tweet.author_id,
    public_metrics: tweet.public_metrics,
    author: usersMap.get(tweet.author_id),
  }));
}

export async function fetchUserProfile(accessToken: string) {
  const response = await fetch(
    "https://api.x.com/2/users/me?user.fields=profile_image_url",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${error}`);
  }

  const body = await response.json();
  return body.data as {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
  };
}
