import { refreshAccessToken } from "./oauth";
import { getUserData, setUserData } from "./kv";
import { Bookmark, BookmarkFolder, UserKVData, XApiBookmarksResponse, XApiFoldersResponse, XApiFolderPostsResponse } from "@/types";

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
    "tweet.fields": "created_at,public_metrics,author_id,entities,attachments,lang,referenced_tweets,note_tweet",
    expansions: "author_id,attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id",
    "user.fields": "username,name,verified,profile_image_url,description,public_metrics",
    "media.fields": "media_key,type,url,preview_image_url,alt_text,width,height,duration_ms,variants",
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
  type UserEntry = NonNullable<NonNullable<XApiBookmarksResponse["includes"]>["users"]>[number];
  type MediaEntry = NonNullable<NonNullable<XApiBookmarksResponse["includes"]>["media"]>[number];

  const usersMap = new Map<string, UserEntry>();
  if (apiResponse.includes?.users) {
    for (const user of apiResponse.includes.users) {
      usersMap.set(user.id, user);
    }
  }

  const mediaMap = new Map<string, MediaEntry>();
  if (apiResponse.includes?.media) {
    for (const m of apiResponse.includes.media) {
      mediaMap.set(m.media_key, m);
    }
  }

  // Build a map of included tweets (for quoted/replied_to)
  type IncludedTweet = NonNullable<NonNullable<XApiBookmarksResponse["includes"]>["tweets"]>[number];
  const tweetsMap = new Map<string, IncludedTweet>();
  if (apiResponse.includes?.tweets) {
    for (const t of apiResponse.includes.tweets) {
      tweetsMap.set(t.id, t);
    }
  }

  return (apiResponse.data || []).map((tweet) => {
    // Resolve media from attachments
    const media = tweet.attachments?.media_keys
      ?.map((key) => mediaMap.get(key))
      .filter(Boolean) as Bookmark["media"];

    // Use note_tweet text if available (long posts)
    const fullText = tweet.note_tweet?.text || tweet.text;
    const entities = tweet.note_tweet?.entities || tweet.entities;

    // Resolve quoted tweet
    const quotedRef = tweet.referenced_tweets?.find((r) => r.type === "quoted");
    let quoted_tweet: Bookmark["quoted_tweet"] = undefined;
    if (quotedRef) {
      const qt = tweetsMap.get(quotedRef.id);
      if (qt) {
        const qtMedia = qt.attachments?.media_keys
          ?.map((key) => mediaMap.get(key))
          .filter(Boolean) as Bookmark["media"];
        quoted_tweet = {
          id: qt.id,
          text: qt.text,
          author_id: qt.author_id,
          created_at: qt.created_at,
          public_metrics: qt.public_metrics,
          entities: qt.entities,
          media: qtMedia && qtMedia.length > 0 ? qtMedia : undefined,
          author: usersMap.get(qt.author_id),
        };
      }
    }

    return {
      id: tweet.id,
      text: fullText,
      created_at: tweet.created_at,
      author_id: tweet.author_id,
      lang: tweet.lang,
      public_metrics: tweet.public_metrics,
      entities,
      media: media && media.length > 0 ? media : undefined,
      referenced_tweets: tweet.referenced_tweets,
      note_tweet: tweet.note_tweet?.text,
      author: usersMap.get(tweet.author_id),
      quoted_tweet,
    };
  });
}

export async function fetchBookmarkFolders(
  accessToken: string,
  userId: string
): Promise<BookmarkFolder[]> {
  const folders: BookmarkFolder[] = [];
  let nextToken: string | undefined;

  do {
    const params = new URLSearchParams({ max_results: "100" });
    if (nextToken) params.set("pagination_token", nextToken);

    const response = await fetch(
      `https://api.x.com/2/users/${userId}/bookmarks/folders?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.status === 429) {
      throw new Error("Rate limited by X API while fetching folders. Please wait a bit and try again.");
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch bookmark folders: ${error}`);
    }

    const data: XApiFoldersResponse = await response.json();
    if (data.data) {
      folders.push(...data.data);
    }
    nextToken = data.meta?.next_token;
  } while (nextToken);

  return folders;
}

export async function fetchFolderPostIds(
  accessToken: string,
  userId: string,
  folderId: string
): Promise<string[]> {
  const postIds: string[] = [];
  let nextToken: string | undefined;

  do {
    const params = new URLSearchParams({ max_results: "100" });
    if (nextToken) params.set("pagination_token", nextToken);

    const response = await fetch(
      `https://api.x.com/2/users/${userId}/bookmarks/folders/${folderId}?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.status === 429) {
      throw new Error("Rate limited by X API while fetching folder contents. Please wait a bit and try again.");
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch folder posts: ${error}`);
    }

    const data: XApiFolderPostsResponse = await response.json();
    if (data.data) {
      postIds.push(...data.data.map((d) => d.id));
    }
    nextToken = data.meta?.next_token;
  } while (nextToken);

  return postIds;
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
