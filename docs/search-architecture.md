# Search Functionality Architecture

## Overview

The search functionality in SamFit allows users to search through their workouts by movement/exercise name or raw text content. The search is implemented as a **client-side, in-memory filter** that operates on workouts already loaded into the application state.

## Architecture Components

### 1. SearchBar Component
**Location**: `src/components/SearchBar.tsx`

A reusable, controlled input component that provides the search UI.

**Features**:
- Search icon on the left
- Clear button (X) appears when text is entered
- Controlled component pattern (value + onChange)
- Customizable placeholder text
- Styled with Tailwind CSS

**Props**:
```typescript
interface SearchBarProps {
  value: string;                    // Current search query
  onChange: (value: string) => void; // Callback when query changes
  placeholder?: string;             // Optional placeholder text
}
```

**State Management**:
- Uses local state (`localValue`) to manage input value
- Syncs with parent-controlled `value` prop via `useEffect`
- Immediately calls `onChange` when user types

### 2. WorkoutsPage - Search Implementation
**Location**: `src/pages/WorkoutsPage.tsx`

The main page where search is implemented.

**Search State**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
```

**Search Logic** (lines 66-88):
```typescript
useEffect(() => {
  if (!searchQuery.trim()) {
    setFilteredWorkouts(workoutsToDisplay);
    return;
  }

  const query = searchQuery.toLowerCase();
  const filtered = workoutsToDisplay.filter((workout) => {
    // Search in movements
    const movementsMatch = workout.extractedData.movements.some((movement) =>
      movement.toLowerCase().includes(query)
    );
    
    // Search in raw text
    const rawTextMatch = workout.rawText.some((line) =>
      line.toLowerCase().includes(query)
    );

    return movementsMatch || rawTextMatch;
  });

  setFilteredWorkouts(filtered);
}, [searchQuery, workoutsToDisplay]);
```

**Search Behavior**:
- **Real-time filtering**: Updates as user types (no debouncing)
- **Case-insensitive**: Converts both query and workout data to lowercase
- **Searches two fields**:
  1. `extractedData.movements[]` - Array of movement/exercise names
  2. `rawText[]` - Array of raw text lines from the workout image
- **Partial matching**: Uses `.includes()` for substring matching
- **OR logic**: Returns workout if match found in either movements OR raw text

### 3. Data Flow

```
User Types in SearchBar
  ↓
onChange callback fires
  ↓
searchQuery state updates
  ↓
useEffect triggers (depends on searchQuery)
  ↓
Filter workoutsToDisplay array
  ↓
Update filteredWorkouts state
  ↓
React re-renders with filtered results
```

### 4. Data Sources

The search operates on `workoutsToDisplay`, which comes from one of two sources:

**A. Own Workouts** (via Zustand store):
```typescript
const { workouts, loadWorkouts } = workoutStore();
// workouts loaded from Supabase and cached in IndexedDB
```

**B. External User Workouts** (direct Supabase call):
```typescript
const [externalWorkouts, setExternalWorkouts] = useState<Workout[]>([]);
// Loaded directly from Supabase (only public workouts)
```

**Data Source Selection**:
```typescript
const workoutsToDisplay = isViewingOwnWorkouts ? workouts : externalWorkouts;
```

### 5. Workout Data Structure

Workouts are searched using this structure:

```typescript
interface Workout {
  id: string;
  name?: string;
  date: string;
  rawText: string[];              // ← Searched field
  extractedData: {
    type: 'time' | 'reps' | 'unknown';
    rounds: number | null;
    movements: string[];           // ← Searched field
    times: number[] | null;
    reps: number[] | null;
  };
  imageUrl: string;
  userId?: string;
  privacy?: 'public' | 'private';
  metadata: {
    confidence?: number;
    notes?: string;
  };
}
```

**Searchable Fields**:
- `extractedData.movements[]` - Exercise names extracted by AI (e.g., "Deadlift", "Burpee")
- `rawText[]` - Original text lines from workout image (e.g., "5 Rounds", "21 Deadlifts")

**Non-Searchable Fields** (not currently searched):
- `name` - Workout name
- `date` - Workout date
- `extractedData.type` - Workout type
- `extractedData.rounds` - Number of rounds
- `extractedData.times` - Time data
- `extractedData.reps` - Rep data

### 6. Performance Characteristics

**Current Implementation**:
- ✅ **Fast**: In-memory array filtering (O(n) where n = number of workouts)
- ✅ **No API calls**: Works entirely client-side
- ✅ **Real-time**: Updates instantly as user types
- ✅ **No debouncing**: Immediate feedback

**Limitations**:
- ⚠️ **No debouncing**: Could be inefficient with very large workout lists (1000+)
- ⚠️ **No indexing**: Linear search through all workouts
- ⚠️ **No fuzzy matching**: Exact substring match only
- ⚠️ **No search history**: No saved searches or suggestions

**Scalability**:
- Works well for typical use cases (< 1000 workouts)
- For larger datasets, consider:
  - Debouncing search input (300-500ms delay)
  - Virtual scrolling for results
  - IndexedDB indexing for faster searches
  - Full-text search library (e.g., Fuse.js)

### 7. UI/UX Features

**Empty States**:
- **No search query**: Shows all workouts
- **No results**: Shows "No workouts found matching '{query}'" with clear button
- **No workouts at all**: Shows "No workouts yet" with upload button (own workouts only)

**Search Bar Features**:
- Visual feedback: Border changes to red on focus
- Clear button: Appears when text is entered
- Placeholder: "Search by movement or exercise..."

**Responsive Design**:
- Mobile: Sticky header with search bar
- Desktop: Static header with search bar

### 8. Legacy Code (Not Currently Used)

**workoutCache.searchWorkouts()**:
**Location**: `src/services/workoutCache.ts` (lines 59-73)

This function exists but is **not currently used** by the search implementation. It provides similar functionality but searches IndexedDB directly instead of in-memory arrays.

```typescript
async searchWorkouts(query: string): Promise<Workout[]> {
  const database = await getDB();
  const allWorkouts = await database.getAll('workouts');
  const lowerQuery = query.toLowerCase();

  return allWorkouts.filter((workout) => {
    const movementsMatch = workout.extractedData.movements.some((movement) =>
      movement.toLowerCase().includes(lowerQuery)
    );
    const rawTextMatch = workout.rawText.some((line) =>
      line.toLowerCase().includes(lowerQuery)
    );
    return movementsMatch || rawTextMatch;
  });
}
```

**Why Not Used?**:
- Current implementation searches already-loaded workouts in memory
- No need to query IndexedDB when data is already in React state
- Faster (no async DB call needed)

**Potential Use Case**:
- Could be used for offline search when workouts aren't loaded
- Could be used for background search indexing

## Search Examples

### Example 1: Search by Movement
**Query**: `"deadlift"`
**Matches**:
- Workout with `movements: ["Deadlift", "Burpee"]` ✅
- Workout with `rawText: ["21 Deadlifts"]` ✅
- Workout with `rawText: ["Deadlift 5x5"]` ✅

### Example 2: Search by Exercise Name
**Query**: `"burpee"`
**Matches**:
- Workout with `movements: ["Burpee", "Pull-up"]` ✅
- Workout with `rawText: ["10 Burpees"]` ✅

### Example 3: Partial Match
**Query**: `"dead"`
**Matches**:
- Workout with `movements: ["Deadlift"]` ✅
- Workout with `rawText: ["Deadlift"]` ✅
- Workout with `rawText: ["Dead hang"]` ✅

### Example 4: No Match
**Query**: `"squat"`
**Matches**:
- Workout with only `movements: ["Deadlift", "Burpee"]` ❌
- Workout with only `rawText: ["5 Rounds", "21 Deadlifts"]` ❌

## Future Enhancements

### Potential Improvements:

1. **Debouncing**: Add 300-500ms delay to reduce unnecessary filtering
2. **Search in more fields**: Include `name`, `date`, `rounds` in search
3. **Fuzzy matching**: Use library like Fuse.js for typo tolerance
4. **Search suggestions**: Show recent searches or autocomplete
5. **Advanced filters**: Filter by date range, workout type, etc.
6. **Search highlighting**: Highlight matched text in results
7. **IndexedDB indexing**: Create search indexes for faster queries
8. **Full-text search**: Use dedicated search library for better performance

## Related Files

- `src/components/SearchBar.tsx` - Search input component
- `src/pages/WorkoutsPage.tsx` - Main search implementation
- `src/services/workoutCache.ts` - Legacy search function (unused)
- `src/store/workoutStore.ts` - Workout state management
- `src/services/supabaseStorage.ts` - Workout data source

## Summary

The search functionality is a **simple, client-side, in-memory filter** that:
- Searches workouts in real-time as the user types
- Matches against movement names and raw text content
- Uses case-insensitive substring matching
- Works on workouts already loaded in React state
- Provides instant feedback with no API calls
- Scales well for typical use cases (< 1000 workouts)

