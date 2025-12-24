# BeyondChats Phase 2 - NodeJS Worker

A script-based worker that enriches blog articles by finding reference content and using LLM to improve the writing quality.

## Overview

This worker implements Phase 2 of the BeyondChats assignment:

1. **Fetches** the latest article from Laravel backend
2. **Searches** for reference articles using Google Custom Search API
3. **Scrapes** content from the top 2 reference articles
4. **Rewrites** the original article using LLM (Groq primary, Gemini fallback) for better quality
5. **Publishes** the improved article back to Laravel

## Tech Stack

- **Node.js** - Runtime
- **axios** - HTTP requests
- **cheerio** - HTML parsing for content extraction
- **dotenv** - Environment variable management
- **Google Custom Search API** - For finding reference articles (JSON API, no HTML scraping)
- **Groq API** - Primary LLM for article rewriting (llama-3.3-70b-versatile)
- **Google Gemini API** - Fallback LLM if Groq fails

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Laravel Backend URL
LARAVEL_BASE_URL=http://beyondchatsbackend.test

# Google Custom Search API credentials
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
GOOGLE_CSX_ENGINE_ID=YOUR_SEARCH_ENGINE_ID

# Primary LLM - Groq API (https://console.groq.com/)
GROQ_API_KEY=YOUR_GROQ_API_KEY

# Fallback LLM - Gemini API Keys (comma-separated for load balancing)
GEMINI_API_KEYS=key1,key2,key3
```

### 3. Get Google Custom Search API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing one
3. Enable **Custom Search API**
4. Create credentials (API Key) - this is your `GOOGLE_API_KEY`
5. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Create a new search engine
7. Get the Search Engine ID - this is your `GOOGLE_CSX_ENGINE_ID`

## Usage

Run the worker:

```bash
node index.js
```

### What Happens

The worker executes these steps in sequence:

**STEP 1:** Fetch latest article from Laravel
```
GET http://laravel/api/articles
→ Returns articles sorted by created_at DESC
→ Selects first article (most recent)
```

**STEP 2:** Search with Google Custom Search API
```
GET https://www.googleapis.com/customsearch/v1
  ?key=GOOGLE_API_KEY
  &cx=GOOGLE_CSX_ENGINE_ID
  &q=<article title>
  &num=10
→ Returns JSON with search results
→ Filters out BeyondChats, YouTube, Facebook
→ Selects first 2 valid article URLs
```

**STEP 3:** Scrape reference articles
```
For each URL:
  → Fetch HTML
  → Parse with cheerio
  → Extract main content (<article>, <main>, etc.)
  → Filter out nav/footer/header
  → Collect paragraphs > 50 chars
```

**STEP 4:** Rewrite with LLM (Dual Provider)
```
Primary: Groq API (llama-3.3-70b-versatile)
  - Original article content
  - Reference articles content
  - Prompt to improve formatting/clarity
  
Fallback: Gemini API (if Groq fails)
  - Uses round-robin key selection
  - Same prompt as Groq
  
Returns: Rewritten article
```

**STEP 5:** Append references
```
Adds to bottom:
---
References:
1. <url1>
2. <url2>
```

**STEP 6:** Publish to Laravel
```
PUT http://laravel/api/articles/{id}
Body: { content: <updated content> }
```

## Data Flow

```
Laravel API (latest article)
        ↓
Google Custom Search API (article title search)
        ↓
Top 2 external article URLs
        ↓
Scrape their HTML content
        ↓
LLM rewrites original article (using references for style)
        ↓
Append references section
        ↓
Updated article published back to Laravel
```

## Key Design Decisions

### Why Google Custom Search API?

- **Reliable**: Official JSON API, no HTML scraping
- **Structured**: Clean data format
- **Stable**: API contract doesn't change like HTML
- **Rate-limited but predictable**: 100 queries/day free tier

### Why Dual LLM Approach?

- **Reliability**: If Groq fails, falls back to Gemini automatically
- **Performance**: Groq's llama-3.3-70b-versatile is fast and high-quality
- **Quota management**: Gemini provides backup capacity
- **Transparent**: Logs which provider is used

### Why Round-Robin for Gemini Keys?

- **Simple**: No complex retry logic needed
- **Fair distribution**: Spreads quota usage across keys
- **Stateless**: No persistence required
- **Transparent**: Logs which key is used

### Content Extraction Strategy

**Priority order for finding main content:**
1. `<article>` tag
2. `<main>` tag
3. Common content selectors: `#content`, `.content`, `.article-content`, `.post-content`
4. `<body>` as fallback

**Filtering logic:**
- Skip paragraphs in nav/footer/header/aside/sidebar
- Only include paragraphs > 50 characters
- Strip excessive whitespace

## Assumptions

1. **Laravel articles are sorted by `created_at DESC`**
   - Worker takes first article as "latest"

2. **Google Custom Search API is configured correctly**
   - Search engine indexes relevant sites
   - API key has quota available

3. **External article URLs are accessible**
   - Not behind paywalls
   - Accept standard HTTP requests

4. **LLM API keys have available quota**
   - Groq is tried first
   - Gemini fallback with round-robin
   - Worker fails if both providers exhausted

5. **Laravel API is available**
   - Running on configured URL
   - Accepts PUT requests for updates

## Error Handling

The worker logs errors clearly and exits with code 1 on failure:

- **Missing env vars**: Validates at startup
- **Laravel fetch fails**: Logs response and exits
- **Google API fails**: Logs error details
- **Scraping fails**: Tries next URL, needs at least 1 success
- **LLM fails**: Logs response data for debugging
- **Publish fails**: Logs Laravel response

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LARAVEL_BASE_URL` | Yes | Laravel backend URL (e.g. `http://localhost:8000`) |
| `GOOGLE_API_KEY` | Yes | Google Cloud API key with Custom Search enabled |
| `GOOGLE_CSX_ENGINE_ID` | Yes | Programmable Search Engine ID |
| `GROQ_API_KEY` | Yes | Groq API key (primary LLM) |
| `GEMINI_API_KEYS` | No | Comma-separated Gemini API keys (fallback LLM) |

## Troubleshooting

### "GOOGLE_API_KEY not set"
Create `.env` file and add your Google API credentials.

### "Google search failed: 403"
- Check API key is valid
- Check Custom Search API is enabled in Google Cloud Console
- Check you haven't exceeded quota (100 queries/day free)

### "No valid search results found"
- Check search engine configuration in Programmable Search Engine console
- Try a different article title
- Ensure search engine isn't restricted to specific sites

### "LLM rewrite failed" / "Both Groq and Gemini failed"
- Check Groq API key is valid (https://console.groq.com/)
- Check Gemini API keys if Groq fails
- If quota exhausted, wait for reset or add more keys

### "Could not scrape any reference articles"
- Reference URLs might be blocking requests
- Try running again to get different search results
- Check if sites require JavaScript rendering

## File Structure

```
workernode/
├── index.js           # Main worker script
├── package.json       # Dependencies
├── .env              # Environment variables (gitignored)
├── .env.example      # Template for .env
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Notes

- This is a **script**, not a server - run it manually when needed
- No authentication required (as per assignment)
- Simple, readable code - easy to explain line-by-line
- No over-engineering - straightforward implementation
- Logs every major step for debugging

## License

This is an assignment project for BeyondChats.
