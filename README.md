# WODsApp - Workout Tracker

A client-side workout logging application that extracts workout data from whiteboard photos using AI.

## Features

- 📸 Upload photos of whiteboard workouts
- 🤖 AI-powered extraction of workout data (movements, rounds, times, reps)
- 💾 Persistent storage via Google Drive
- 🔍 Search workouts by movement or exercise
- 📊 View and edit workout history

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google OAuth** - Authentication
- **Google Drive API** - Storage
- **Google Gemini API** - AI/OCR
- **IndexedDB** - Local caching
- **Zustand** - State management

## Setup

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Console account
- Google account for testing

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure `.env.local`:
   - Get Google OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Get Gemini API Key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add both to `.env.local`

5. Run development server:
   ```bash
   npm run dev
   ```

### Google Cloud Console Setup

1. Create a new project or select existing
2. Enable APIs:
   - Google Drive API
   - Google OAuth 2.0
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173` (for dev)
   - Authorized redirect URIs: `http://localhost:5173` (for dev)
4. Copy Client ID to `.env.local`

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Deployment

### GitHub Pages

1. Update `vite.config.ts` base path if needed
2. Build the project: `npm run build`
3. Deploy `dist/` folder to GitHub Pages
4. Update OAuth redirect URIs in Google Cloud Console to include your GitHub Pages URL

## Project Structure

```
src/
  components/     # React components
  pages/          # Page components
  services/       # API services (Drive, Gemini, Cache)
  store/          # Zustand stores
  hooks/          # Custom React hooks
  types/          # TypeScript types
  utils/          # Utility functions
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Style Guide](./docs/style-guide.md)
- [Implementation Plan](./docs/implementation-plan.md)
- [Gemini Prompt Design](./docs/gemini-prompt-design.md)

## License

MIT

