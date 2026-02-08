<div align="center">

# Bookmark Export

**Export your X bookmarks as structured JSON.**
Self-hosted. Open source. Bring your own API keys.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

Bookmark Export lets you sign in with your X account and download all of your bookmarks — with full metadata — as a clean `.json` file. It runs on your own infrastructure with your own API keys, so your data never touches a third-party service.

## Features

| Feature | Description |
|---|---|
| **OAuth 2.0 PKCE** | Secure sign-in with X — no passwords stored |
| **Rich data export** | Full post text, author info, media, quoted posts, entities (links, mentions, hashtags), metrics, and language |
| **Folder support** | View and filter bookmarks by X bookmark folders |
| **Search** | Filter by text, author name, or username |
| **JSON download** | Export filtered or full bookmark data as `.json` |
| **Bookmark viewer** | Upload and browse a previously exported file at `/view` |
| **Caching** | Bookmarks are cached in Redis — refreshing doesn't re-fetch from the API |

## Tech Stack

| Technology | Role |
|---|---|
| [Next.js 16](https://nextjs.org/) | App Router, Turbopack |
| [React 19](https://react.dev/) | UI framework |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Upstash Redis](https://upstash.com/) | Session & bookmark caching |
| [jose](https://github.com/panva/jose) | Encrypted JWT sessions |
| [X API v2](https://developer.x.com/) | Bookmarks, folders, OAuth 2.0 PKCE |

## Getting Started

### Prerequisites

- **Node.js** 18+
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
│   ├── page.tsx                # Landing page
│   ├── dashboard/              # Authenticated bookmark view
│   ├── view/                   # Public JSON viewer
│   └── api/
│       ├── auth/               # OAuth login, callback, logout
│       ├── bookmarks/          # Bookmark fetching + caching
│       ├── folders/            # Folder listing + membership
│       └── status/             # User status check
├── components/
│   ├── BookmarkCard.tsx        # Rich bookmark card (media, quotes, entities)
│   ├── BookmarkList.tsx        # List with search, folder tabs, pagination
│   ├── BookmarkViewer.tsx      # Drag-and-drop JSON upload viewer
│   ├── DownloadButton.tsx      # JSON export button
│   ├── BuyMoreButton.tsx       # Fetch more bookmarks trigger
│   ├── Header.tsx              # App header with user info
│   └── SignInButton.tsx        # OAuth sign-in button
├── lib/
│   ├── x-api.ts                # X API v2 communication
│   ├── kv.ts                   # Redis helpers (sessions, caching)
│   └── session.ts              # Encrypted JWT session management
└── types/
    └── index.ts                # TypeScript type definitions
```

## Deployment

Deploy to [Vercel](https://vercel.com) and set the environment variables in your project settings. Update `X_REDIRECT_URI` to match your production callback URL.

## License

MIT

---

<div align="center">

Built by [@lamps_apple](https://x.com/lamps_apple)

</div>
