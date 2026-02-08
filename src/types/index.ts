// --- Enriched Bookmark Types ---

export interface TweetEntity {
  urls?: Array<{
    start: number;
    end: number;
    url: string;
    expanded_url: string;
    display_url: string;
    title?: string;
    description?: string;
  }>;
  mentions?: Array<{
    start: number;
    end: number;
    username: string;
    id: string;
  }>;
  hashtags?: Array<{
    start: number;
    end: number;
    tag: string;
  }>;
  cashtags?: Array<{
    start: number;
    end: number;
    tag: string;
  }>;
}

export interface Media {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
  width?: number;
  height?: number;
  duration_ms?: number;
  variants?: Array<{
    bit_rate?: number;
    content_type: string;
    url: string;
  }>;
}

export interface ReferencedTweet {
  type: "retweeted" | "quoted" | "replied_to";
  id: string;
}

export interface QuotedTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: TweetEntity;
  media?: Media[];
  author?: BookmarkAuthor;
}

export interface BookmarkAuthor {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  profile_image_url?: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface Bookmark {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  lang?: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: TweetEntity;
  media?: Media[];
  referenced_tweets?: ReferencedTweet[];
  note_tweet?: string;
  author?: BookmarkAuthor;
  quoted_tweet?: QuotedTweet;
}

export interface BookmarkFolder {
  id: string;
  name: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  hasMore: boolean;
  totalFetched: number;
  paidBatches: number;
}

export interface FoldersResponse {
  folders: BookmarkFolder[];
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
    lang?: string;
    public_metrics: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
    };
    entities?: TweetEntity;
    attachments?: {
      media_keys?: string[];
    };
    referenced_tweets?: ReferencedTweet[];
    note_tweet?: {
      text: string;
      entities?: TweetEntity;
    };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      verified: boolean;
      profile_image_url?: string;
      description?: string;
      public_metrics?: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
      };
    }>;
    media?: Array<{
      media_key: string;
      type: "photo" | "video" | "animated_gif";
      url?: string;
      preview_image_url?: string;
      alt_text?: string;
      width?: number;
      height?: number;
      duration_ms?: number;
      variants?: Array<{
        bit_rate?: number;
        content_type: string;
        url: string;
      }>;
    }>;
    tweets?: Array<{
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
      entities?: TweetEntity;
      attachments?: {
        media_keys?: string[];
      };
    }>;
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}

export interface XApiFoldersResponse {
  data?: Array<{
    id: string;
    name: string;
  }>;
  errors?: Array<unknown>;
  meta?: {
    next_token?: string;
  };
}

export interface XApiFolderPostsResponse {
  data?: Array<{
    id: string;
  }>;
  errors?: Array<unknown>;
  meta?: {
    next_token?: string;
  };
}
