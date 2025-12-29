# WODsApp Implementation Plan

## Overview
This document tracks the implementation progress of the WODsApp workout logging application. Tasks are organized by phase and can be marked as complete as work progresses.

## Related Documentation
- **Architecture**: `docs/architecture.md` - System architecture and technology decisions
- **Style Guide**: `docs/style-guide.md` - CrossFit-inspired design system and UI components
- **Prompt Design**: `docs/gemini-prompt-design.md` - Gemini API prompts and extraction logic

**Status Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ❌ Blocked

---

## Phase 0: Project Setup & Configuration
**Goal**: Initialize the project with all necessary tooling and dependencies

### 0.1 Project Initialization
- ⬜ Initialize React + TypeScript project with Vite
- ⬜ Configure ESLint and Prettier
- ⬜ Set up Git repository and initial commit
- ⬜ Create `.gitignore` file
- ⬜ Set up project folder structure

### 0.2 Dependencies Installation
- ⬜ Install core dependencies:
  - `react`, `react-dom`, `react-router-dom`
  - `typescript`, `@types/react`, `@types/react-dom`
- ⬜ Install UI/styling:
  - `tailwindcss` and configuration
  - `@headlessui/react` (for modals, dropdowns)
  - `react-icons` or `lucide-react` (for icons)
- ⬜ Install Google services:
  - `@react-oauth/google` (Google OAuth)
  - `googleapis` or `gapi-script` (Drive API)
- ⬜ Install state management:
  - `zustand` or `@tanstack/react-query`
- ⬜ Install utilities:
  - `idb` or `dexie` (IndexedDB wrapper)
  - `date-fns` (date formatting)
  - `uuid` (for generating IDs)

### 0.3 Environment Configuration
- ⬜ Create `.env.local` template
- ⬜ Set up environment variable types
- ⬜ Configure Vite environment variables
- ⬜ Document required API keys and setup

### 0.4 Google Cloud Console Setup
- ⬜ Create Google Cloud Project
- ⬜ Enable Google Drive API
- ⬜ Enable Google OAuth 2.0
- ⬜ Create OAuth 2.0 credentials
- ⬜ Configure authorized JavaScript origins
- ⬜ Configure authorized redirect URIs
- ⬜ Get Gemini API key (if separate from OAuth)

### 0.5 Build & Deploy Configuration
- ⬜ Configure Vite build settings
- ⬜ Set up GitHub Pages deployment
- ⬜ Create GitHub Actions workflow (optional)
- ⬜ Test build process

**Phase 0 Progress**: 0/20 tasks complete

---

## Phase 1: Core Infrastructure & Authentication
**Goal**: Set up authentication and basic app structure

### 1.1 App Structure & Routing
- ⬜ Create main `App.tsx` with routing
- ⬜ Set up React Router routes:
  - `/` - Home/Landing page
  - `/workouts` - Workout list/search
  - `/upload` - Upload new workout
  - `/workout/:id` - Workout detail view
- ⬜ Create layout components (Header, Footer, Nav)
- ⬜ Implement protected routes (require auth)

### 1.2 Google OAuth Integration
- ⬜ Install and configure `@react-oauth/google`
- ⬜ Create `AuthProvider` component
- ⬜ Implement login flow
- ⬜ Implement logout flow
- ⬜ Handle token refresh
- ⬜ Store auth state (sessionStorage)
- ⬜ Create `useAuth` hook

### 1.3 Navigation Component
- ⬜ Create `Navbar` component with CrossFit styling
- ⬜ Implement fixed navbar with scroll behavior
- ⬜ Add user profile/avatar display
- ⬜ Add logout button
- ⬜ Make responsive (mobile menu)

### 1.4 Basic Layout Components
- ⬜ Create `Layout` wrapper component
- ⬜ Create `Footer` component (CrossFit style)
- ⬜ Create `Container` component (max-width wrapper)
- ⬜ Create `Button` component (primary/secondary variants)
- ⬜ Create `LoadingSpinner` component

**Phase 1 Progress**: 0/19 tasks complete

---

## Phase 2: Storage Layer (Google Drive + IndexedDB)
**Goal**: Implement persistent storage and local caching

### 2.1 Google Drive API Integration
- ⬜ Set up Google Drive API client
- ⬜ Create `DriveStorage` service/utility
- ⬜ Implement folder creation (`/WODsApp/workouts/`)
- ⬜ Implement file upload (JSON workout files)
- ⬜ Implement file retrieval (get all workouts)
- ⬜ Implement file update
- ⬜ Implement file deletion
- ⬜ Handle API errors and retries

### 2.2 IndexedDB Cache Layer
- ⬜ Set up IndexedDB database schema
- ⬜ Create `WorkoutCache` service/utility
- ⬜ Implement cache initialization
- ⬜ Implement cache write (store workout)
- ⬜ Implement cache read (get all workouts)
- ⬜ Implement cache search (query by movement/text)
- ⬜ Implement cache update
- ⬜ Implement cache delete
- ⬜ Implement cache sync (refresh from Drive)

### 2.3 Storage Service Abstraction
- ⬜ Create unified `StorageService` that uses both Drive + IndexedDB
- ⬜ Implement save workflow (save to both)
- ⬜ Implement load workflow (check cache first, fallback to Drive)
- ⬜ Implement sync mechanism
- ⬜ Handle offline scenarios

### 2.4 Data Models & Types
- ⬜ Define TypeScript interfaces:
  - `Workout` interface
  - `ExtractedData` interface
  - `WorkoutMetadata` interface
- ⬜ Create data validation utilities
- ⬜ Create data transformation utilities (JSON serialization)

**Phase 2 Progress**: 0/25 tasks complete

---

## Phase 3: AI/OCR Integration (Gemini API)
**Goal**: Extract text and structured data from workout images

**📋 Reference**: See `docs/gemini-prompt-design.md` for detailed prompt templates and implementation examples.

### 3.1 Gemini API Integration
- ⬜ Set up Gemini API client
- ⬜ Create `WorkoutExtractor` service
- ⬜ Implement image upload (base64 conversion)
- ⬜ Implement prompt template (use hybrid prompt from `gemini-prompt-design.md`)
- ⬜ Implement API call with error handling
- ⬜ Parse Gemini response into structured data (handle markdown-wrapped JSON)
- ⬜ Implement fallback handling (rawText always available)

### 3.2 Image Processing
- ⬜ Create image upload component
- ⬜ Implement drag & drop functionality
- ⬜ Implement file picker
- ⬜ Validate image file types
- ⬜ Compress/resize images if needed
- ⬜ Convert image to base64 for API
- ⬜ Display image preview

### 3.3 Data Extraction & Parsing
- ⬜ Extract raw text lines from image (required - always succeeds)
- ⬜ Identify workout type (time-based vs reps-based) - see prompt design doc
- ⬜ Extract rounds information
- ⬜ Extract movements/exercises
- ⬜ Extract times (if time-based, convert MM:SS to seconds)
- ⬜ Extract reps (if reps-based)
- ⬜ Handle edge cases and errors
- ⬜ Implement confidence scoring

### 3.4 Extraction UI Components
- ⬜ Create `ImageUpload` component
- ⬜ Create loading state during extraction
- ⬜ Display extracted data preview
- ⬜ Show extraction confidence/raw text

**Phase 3 Progress**: 0/20 tasks complete

---

## Phase 4: Workout Management UI
**Goal**: Build user interface for viewing, editing, and managing workouts

### 4.1 Workout Editor Component
- ⬜ Create `WorkoutEditor` modal component
- ⬜ Display extracted data in editable form
- ⬜ Implement form fields:
  - Date picker
  - Workout type selector
  - Rounds input
  - Movements list (add/remove/edit)
  - Times/Reps inputs (dynamic based on rounds)
- ⬜ Implement form validation
- ⬜ Implement save functionality
- ⬜ Implement cancel/discard functionality

### 4.2 Workout List Component
- ⬜ Create `WorkoutList` component
- ⬜ Display workouts in card grid layout
- ⬜ Show workout summary (date, type, movements)
- ⬜ Implement pagination or infinite scroll
- ⬜ Add workout card hover effects
- ⬜ Make cards clickable (navigate to detail)

### 4.3 Workout Detail View
- ⬜ Create `WorkoutDetail` page/component
- ⬜ Display full workout information
- ⬜ Show original image
- ⬜ Display extracted data
- ⬜ Show raw text lines
- ⬜ Implement edit button
- ⬜ Implement delete button
- ⬜ Add navigation back to list

### 4.4 Workout Search
- ⬜ Create `WorkoutSearch` component
- ⬜ Implement search input with debouncing
- ⬜ Search by movement name
- ⬜ Search by raw text content
- ⬜ Display search results
- ⬜ Highlight search matches
- ⬜ Show "no results" state

### 4.5 Upload Page
- ⬜ Create upload page/route
- ⬜ Combine image upload + extraction flow
- ⬜ Show extraction progress
- ⬜ Display extraction results
- ⬜ Open editor modal on completion
- ⬜ Handle extraction errors
- ⬜ Allow re-upload if extraction fails

**Phase 4 Progress**: 0/28 tasks complete

---

## Phase 5: Styling & UI Polish
**Goal**: Apply CrossFit-inspired design system

### 5.1 Tailwind CSS Configuration
- ⬜ Configure Tailwind with custom colors (from style guide)
- ⬜ Configure custom fonts (Oswald, Open Sans)
- ⬜ Set up spacing scale
- ⬜ Configure breakpoints
- ⬜ Create custom utility classes

### 5.2 Global Styles
- ⬜ Set up CSS variables (from style guide)
- ⬜ Create base typography styles
- ⬜ Set up reset/normalize CSS
- ⬜ Configure font loading (Google Fonts)
- ⬜ Set up dark mode support (if needed)

### 5.3 Component Styling
- ⬜ Style Navbar (fixed, transparent-to-solid)
- ⬜ Style Buttons (primary red, secondary outline)
- ⬜ Style Cards (workout cards with hover)
- ⬜ Style Input fields
- ⬜ Style Search bar
- ⬜ Style Modal/Dialog
- ⬜ Style Hero section
- ⬜ Style Upload area
- ⬜ Style Footer

### 5.4 Responsive Design
- ⬜ Make Navbar responsive (mobile menu)
- ⬜ Make WorkoutList responsive (grid → stack)
- ⬜ Make WorkoutDetail responsive
- ⬜ Make Upload page responsive
- ⬜ Test on mobile devices
- ⬜ Test on tablets

### 5.5 Animations & Transitions
- ⬜ Add button hover animations
- ⬜ Add card hover effects
- ⬜ Add modal open/close animations
- ⬜ Add page transition animations
- ⬜ Add loading state animations

**Phase 5 Progress**: 0/25 tasks complete

---

## Phase 6: State Management & Data Flow
**Goal**: Implement efficient state management and data synchronization

### 6.1 State Management Setup
- ⬜ Set up Zustand store (or React Query)
- ⬜ Create auth store
- ⬜ Create workouts store
- ⬜ Create UI state store (modals, loading)

### 6.2 Data Fetching & Caching
- ⬜ Implement React Query setup (if using)
- ⬜ Create workout queries
- ⬜ Implement cache invalidation
- ⬜ Handle loading states
- ⬜ Handle error states
- ⬜ Implement optimistic updates

### 6.3 Sync Logic
- ⬜ Implement initial cache load from Drive
- ⬜ Implement cache refresh mechanism
- ⬜ Handle sync conflicts
- ⬜ Show sync status to user
- ⬜ Implement manual refresh button

**Phase 6 Progress**: 0/15 tasks complete

---

## Phase 7: Error Handling & Edge Cases
**Goal**: Handle errors gracefully and improve user experience

### 7.1 Error Handling
- ⬜ Create error boundary component
- ⬜ Handle API errors (Drive, Gemini)
- ⬜ Handle network errors
- ⬜ Handle authentication errors
- ⬜ Display user-friendly error messages
- ⬜ Implement error logging (console for now)

### 7.2 Edge Cases
- ⬜ Handle empty workout list
- ⬜ Handle failed image extraction
- ⬜ Handle invalid image formats
- ⬜ Handle large images
- ⬜ Handle offline mode
- ⬜ Handle expired auth tokens
- ⬜ Handle Drive quota exceeded

### 7.3 Loading States
- ⬜ Add loading spinners for async operations
- ⬜ Add skeleton loaders for lists
- ⬜ Show progress indicators
- ⬜ Disable buttons during operations

**Phase 7 Progress**: 0/16 tasks complete

---

## Phase 8: Testing & Quality Assurance
**Goal**: Ensure app works correctly and handles edge cases

### 8.1 Manual Testing
- ⬜ Test authentication flow
- ⬜ Test image upload
- ⬜ Test workout extraction
- ⬜ Test workout save/load
- ⬜ Test search functionality
- ⬜ Test edit/delete workflows
- ⬜ Test responsive design
- ⬜ Test on different browsers (Chrome, Firefox, Safari)
- ⬜ Test on mobile devices

### 8.2 Bug Fixes
- ⬜ Fix identified bugs
- ⬜ Improve error messages
- ⬜ Optimize performance
- ⬜ Fix accessibility issues

### 8.3 Code Quality
- ⬜ Run ESLint and fix issues
- ⬜ Format code with Prettier
- ⬜ Review TypeScript types
- ⬜ Remove console.logs
- ⬜ Add code comments where needed

**Phase 8 Progress**: 0/15 tasks complete

---

## Phase 9: Deployment & Documentation
**Goal**: Deploy to production and document the project

### 9.1 Pre-Deployment
- ⬜ Final testing in production build
- ⬜ Verify all environment variables
- ⬜ Check bundle size
- ⬜ Optimize images/assets
- ⬜ Test production build locally

### 9.2 GitHub Pages Deployment
- ⬜ Configure GitHub Pages settings
- ⬜ Set up deployment workflow
- ⬜ Deploy to GitHub Pages
- ⬜ Verify deployment works
- ⬜ Test on live URL
- ⬜ Update OAuth redirect URIs if needed

### 9.3 Documentation
- ⬜ Create README.md with:
  - Project description
  - Setup instructions
  - Environment variables
  - Deployment guide
- ⬜ Document API setup (Google Cloud Console)
- ⬜ Add code comments for complex logic
- ⬜ Create user guide (how to use the app)

### 9.4 Post-Deployment
- ⬜ Monitor for errors
- ⬜ Test all features on live site
- ⬜ Fix any deployment issues
- ⬜ Set up error monitoring (optional)

**Phase 9 Progress**: 0/15 tasks complete

---

## Overall Progress Summary

**Total Tasks**: 198
**Completed**: 0
**In Progress**: 0
**Not Started**: 198
**Blocked**: 0

**Progress**: 0%

---

## Quick Start Checklist

Before starting development, ensure you have:

- [ ] Node.js and npm/yarn installed
- [ ] Google Cloud Console account
- [ ] Google account for testing
- [ ] GitHub account for repository
- [ ] Code editor (VS Code recommended)
- [ ] Git installed

---

## Notes & Blockers

### Current Blockers
_None at the moment_

### Important Notes
- All API keys should be kept in `.env.local` and never committed
- Test with real workout images from `example-photos/` folder
- Consider MVP scope - some features can be added later
- Focus on core workflow first: upload → extract → save → search

### Future Enhancements (Post-MVP)
- Structured workout types with validation
- Workout templates
- Progress tracking/analytics
- Export to CSV/PDF
- PWA support (offline mode)
- Workout sharing (if multi-user in future)

---

## How to Use This Plan

1. **Start with Phase 0**: Complete all setup tasks before moving on
2. **Work sequentially**: Each phase builds on previous phases
3. **Update status**: Mark tasks as you complete them:
   - ⬜ → 🟡 when you start
   - 🟡 → ✅ when complete
   - ⬜ → ❌ if blocked (add note in Blockers section)
4. **Track progress**: Update the summary at the bottom
5. **Adjust as needed**: Feel free to reorder or add tasks based on your workflow

---

**Last Updated**: [Update this date when you make changes]

