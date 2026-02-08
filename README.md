# Bookmark Export

Export your X (Twitter) bookmarks as structured JSON. Self-hosted — bring your own X API keys.

## Features

- **OAuth 2.0 PKCE** — Secure sign-in with X, no password stored
- **Rich data export** — Full tweet text, author info, media, quoted tweets, entities (links, mentions, hashtags), metrics, and language
- **Folder support** — View and filter bookmarks by X bookmark folders
- **Search** — Filter bookmarks by text, author name, or username
- **JSON download** — Export filtered or full bookmark data as a `.json` file
- **Bookmark viewer** — Upload and browse a previously exported JSON file at `/view`
- **Caching** — Bookmarks are cached in Redis so refreshing doesn't re-fetch from the API

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **Upstash Redis** — session & bookmark caching
- **jose** — encrypted JWT sessions
- **X API v2** — bookmarks, folders, OAuth 2.0 PKCE

## Getting Started

### Prerequisites

- Node.js 18+
- An [X Developer App](https://developer.x.com/) with OAuth 2.0 (PKCE) enabled
- An [Upstash Redis](https://upstash.com/) database

### Environment Variables

Create a `.env` file in the project root:

```env
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=http://localhost:3000/api/auth/callback

KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token

SESSION_SECRET=a_random_32_char_string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Authenticated bookmark view
│   ├── view/                 # Public JSON viewer
│   └── api/
│       ├── auth/             # OAuth login, callback, logout
│       ├── bookmarks/        # Bookmark fetching + caching
│       ├── folders/          # Folder listing + membership
│       └── status/           # User status check
├── components/
│   ├── BookmarkCard.tsx      # Rich bookmark card (media, quotes, entities)
│   ├── BookmarkList.tsx      # List with search, folder tabs, pagination
│   ├── BookmarkViewer.tsx    # Drag-and-drop JSON upload viewer
│   ├── DownloadButton.tsx    # JSON export button
│   ├── BuyMoreButton.tsx     # Fetch more bookmarks trigger
│   ├── Header.tsx            # App header with user info
│   └── SignInButton.tsx      # OAuth sign-in button
├── lib/
│   ├── x-api.ts              # X API v2 communication
│   ├── kv.ts                 # Redis helpers (sessions, caching)
│   └── session.ts            # Encrypted JWT session management
└── types/
    └── index.ts              # TypeScript type definitions
```

## Deploy

Deploy to [Vercel](https://vercel.com) and set the environment variables in the project settings. Update `X_REDIRECT_URI` to your production callback URL.

## License

MIT
