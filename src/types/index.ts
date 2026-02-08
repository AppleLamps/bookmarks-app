export interface Bookmark {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  author?: {
    id: string;
    username: string;
    name: string;
    verified: boolean;
  };
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  hasMore: boolean;
  totalFetched: number;
  paidBatches: number;
}

export interface UserKVData {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  username: string;
  name: string;
  profileImageUrl: string;
  nextToken: string | null;
  totalFetched: number;
  paidBatches: number;
  stripeSessionIds: string[];
}

export interface SessionPayload {
  xUserId: string;
  username: string;
  profileImageUrl: string;
  iat: number;
  exp: number;
}

export interface XApiBookmarksResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
    };
  }>;
  includes?: {
    users: Array<{
      id: string;
      username: string;
      name: string;
      verified: boolean;
    }>;
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}
