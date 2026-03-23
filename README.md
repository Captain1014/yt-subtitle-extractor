# YT Subtitle Extractor

Extract subtitles from any YouTube video or an entire channel — no API key needed for single videos.

## Features

- **Single Video** — Paste a YouTube URL, get subtitles instantly (plain text or with timestamps)
- **Channel Mode** — Fetch all videos from a channel and extract subtitles in bulk
- **Download** — Export all channel subtitles as a single `.txt` file
- **Copy** — One-click copy to clipboard

## Setup

```bash
npm install
```

### YouTube Data API Key (for Channel Mode only)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a project → Enable "YouTube Data API v3"
3. Create an API key under Credentials

```bash
# .env.local
YOUTUBE_API_KEY=AIzaSy...
```

## Run

```bash
npm run dev
```

- `http://localhost:3000` — Single video extractor
- `http://localhost:3000/channel` — Channel bulk extractor

## Tech

- Next.js (App Router)
- youtube-transcript
- YouTube Data API v3
