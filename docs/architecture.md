# WODsApp - Architecture Document

## Overview
A client-side only workout logging web application that allows users to upload photos of whiteboard workout notes, extract text using AI/OCR, and store/search workout history. Optimized for cost (essentially free) and single-user usage.

## Core Requirements
- Upload photos of whiteboard workout notes
- Extract text from images (OCR/AI)
- Store workouts in searchable format
- Search past workouts by movement/exercise
- Single user application
- Client-side only (no backend server)
- Cost-optimized (free tier services)

## Architecture Decisions

### 1. Hosting: GitHub Pages
**Cost: FREE**

- Static site hosting for React SPA
- Automatic HTTPS
- Custom domain support
- Easy deployment via GitHub Actions or manual push
- No server costs, no infrastructure management

**Alternative considered**: Netlify, Vercel (both free but GitHub Pages is simpler for MVP)

### 2. Authentication: Google OAuth 2.0
**Cost: FREE**

- Single sign-on with Google account
- Client-side only authentication flow
- Access token stored in browser session
- Required for accessing Google Drive API (storage solution)
- Uses `@react-oauth/google` or `google-auth-library` for React

**Setup required**:
- Create OAuth 2.0 credentials in Google Cloud Console
- Configure authorized JavaScript origins (GitHub Pages domain)
- Configure authorized redirect URIs

### 3. Storage: Google Drive API
**Cost: FREE (15GB included with Google account)**

**Why Google Drive?**
- Free 15GB storage (more than enough for single user)
- Persistent storage (not lost if browser cache cleared)
- Already using Google Auth, seamless integration
- Can store structured JSON files
- No database costs or management
- Can be accessed/manually edited if needed

**Implementation**:
- Store each workout as a JSON file in a dedicated folder
- File naming: `workout-{timestamp}-{id}.json`
- Folder structure: `/WODsApp/workouts/`
- Each workout JSON contains:
  ```json
  {
    "id": "uuid",
    "date": "ISO-8601",
    "rawText": ["line1", "line2", ...],
    "extractedData": {
      "type": "time" | "reps",
      "rounds": number,
      "movements": string[],
      "times": number[] | null,
      "reps": number[] | null
    },
    "imageUrl": "base64 or drive file ID",
    "metadata": {}
  }
  ```

**Searchability**:
- Google Drive API supports `fullText` search operator for searching within file contents
- Can search JSON file contents using queries like: `fullText contains 'deadlift'`
- However, for optimal performance with many workouts, implement **client-side caching**:
  - On app load: Fetch all workout files from Drive (or use Drive search API)
  - Cache workout metadata in IndexedDB for fast local searches
  - Sync cache when new workouts are added
  - Search happens instantly in browser, no API calls needed
  - Periodically refresh cache from Drive to stay in sync

**Search Implementation Strategy**:
1. **Initial Load**: Fetch all workout files from Drive folder (or use Drive search if filtering)
2. **Cache in IndexedDB**: Store workout metadata (id, date, movements, rawText) for fast access
3. **Search**: Query IndexedDB cache (instant, no API calls)
4. **Sync**: When new workout added, update both Drive and IndexedDB cache
5. **Refresh**: Optionally refresh cache from Drive on app load or manual refresh

This hybrid approach gives:
- ✅ Fast, instant searches (IndexedDB)
- ✅ Persistent storage (Google Drive)
- ✅ Works offline (cached data)
- ✅ No search API costs

**Alternative considered**: 
- Firebase Firestore (free tier: 1GB, 50K reads/day) - better search but more complex, overkill for single user
- IndexedDB only - free but can be cleared, not persistent
- Google Sheets API - could work but less flexible than JSON files, better search but more limited

### 4. AI/OCR: Google Gemini API
**Cost: FREE (generous free tier)**

**Why Gemini?**
- Free tier with generous limits for single user
- Excellent vision capabilities for image-to-text
- Can extract structured data from images
- Part of Google ecosystem (consistent auth)
- Can be called directly from client (with API key)

**Implementation**:
- Use Gemini Pro Vision model
- Send image as base64 or file reference
- Prompt: See `docs/gemini-prompt-design.md` for detailed prompt templates
- Hybrid approach: Extract raw text (always) + structured data (when possible)
- Return structured JSON that can be validated/edited by user
- Handle graceful fallback if structured extraction fails (rawText always available)

**API Flow**:
1. User uploads image
2. Convert image to base64 or upload to Drive temporarily
3. Call Gemini API with image + prompt
4. Parse response into structured workout data
5. Show user confirmation/edit modal
6. Save to Drive on confirmation

**Alternative considered**:
- Google Cloud Vision API (free tier: 1000 requests/month) - OCR only, would need additional parsing
- OpenAI GPT-4 Vision (paid, more expensive)

### 5. Frontend: React + TypeScript
**Cost: FREE**

**Tech Stack**:
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (faster than Create React App)
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling (or CSS modules for smaller bundle)
- **React Query / SWR** - Data fetching/caching
- **Zustand / Context API** - State management (lightweight)
- **IndexedDB (via idb or Dexie.js)** - Local caching for fast searches

**Key Components**:
- `AuthProvider` - Google OAuth wrapper
- `ImageUpload` - Drag & drop or file picker
- `WorkoutExtractor` - Calls Gemini API
- `WorkoutEditor` - Modal for confirming/editing extracted data
- `WorkoutList` - Display all workouts
- `WorkoutSearch` - Search by movement/exercise (queries IndexedDB cache)
- `DriveStorage` - Wrapper for Google Drive API calls
- `WorkoutCache` - IndexedDB wrapper for local workout caching/search

## Data Flow

### Upload & Extract Flow
```
User uploads image
  ↓
Convert to base64
  ↓
Call Gemini API (with Google OAuth token)
  ↓
Parse response → structured workout data
  ↓
Show confirmation modal
  ↓
User confirms/edits
  ↓
Save JSON to Google Drive
  ↓
Update local cache
```

### Search Flow
```
User enters search query
  ↓
Query IndexedDB cache (instant, no API call)
  ↓
Filter by movement/exercise name in rawText or extractedData.movements
  ↓
Display results
  ↓
(Optional) If cache stale, refresh from Drive in background
```

**Note**: For initial app load or cache refresh:
```
App loads
  ↓
Check IndexedDB cache age
  ↓
If stale or empty: Fetch all workouts from Drive folder
  ↓
Parse JSON files, extract searchable data
  ↓
Store in IndexedDB cache
  ↓
App ready for fast searches
```

## Security Considerations

1. **API Keys**: Store Gemini API key in environment variable (Vite env vars)
   - Use `.env.local` (gitignored)
   - Access via `import.meta.env.VITE_GEMINI_API_KEY`
   - Note: Client-side API keys are visible in bundle (acceptable for free tier, single user)

2. **OAuth Tokens**: 
   - Store access token in memory/sessionStorage (not localStorage for security)
   - Refresh token handling if needed
   - Token expires, user re-authenticates

3. **CORS**: 
   - Configure Google Cloud Console for authorized origins
   - GitHub Pages domain must be whitelisted

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| GitHub Pages | FREE | Unlimited bandwidth for static sites |
| Google OAuth | FREE | No cost for authentication |
| Google Drive API | FREE | 15GB included with Google account |
| Gemini API | FREE | Generous free tier for single user |
| **Total** | **$0/month** | |

## Deployment

1. **Build**: `npm run build` creates static files in `dist/`
2. **Deploy**: Push `dist/` contents to `gh-pages` branch or use GitHub Actions
3. **Domain**: Configure custom domain if desired (optional)

## Development Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env.local`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Future Enhancements (Not in MVP)

- Structured workout types with validation
- Workout templates
- Progress tracking/analytics
- Export to CSV/PDF
- Mobile app (PWA)
- Offline support with IndexedDB fallback

## Limitations & Trade-offs

1. **Client-side only**: All logic runs in browser, API keys visible (acceptable for single user, free tier)
2. **Google Drive dependency**: Requires Google account, data stored in user's Drive
3. **Hybrid storage**: Google Drive (persistent) + IndexedDB (cache) - cache can be cleared but data persists in Drive
4. **No real-time sync**: Data loaded on-demand from Drive, cached locally for performance
5. **Rate limits**: Gemini API has rate limits (should be fine for single user)
6. **Image storage**: Images stored as base64 in JSON or separate Drive files (15GB should be plenty)
7. **Search performance**: First load requires fetching from Drive, subsequent searches use local cache (instant)

## Alternative Architecture (If Google Drive doesn't work)

**Fallback: IndexedDB + Manual Export**
- Store workouts in browser IndexedDB
- Add "Export" feature to download JSON backup
- User manually backs up data
- **Pros**: No external dependencies, completely free
- **Cons**: Data lost if browser cache cleared, not persistent across devices

