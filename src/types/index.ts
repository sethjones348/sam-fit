export interface ExtractedData {
  type: 'time' | 'reps' | 'unknown';
  rounds: number | null;
  movements: string[];
  times: number[] | null; // In seconds
  reps: number[] | null;
}

export interface Workout {
  id: string;
  name?: string; // Optional for backward compatibility, will be generated if missing
  date: string; // ISO-8601
  rawText: string[];
  extractedData: ExtractedData;
  imageUrl: string; // base64 or drive file ID
  metadata: {
    confidence?: number;
    notes?: string;
  };
}

export interface WorkoutExtraction {
  name?: string; // Optional - will be auto-generated if not provided
  rawText: string[];
  type: 'time' | 'reps' | 'unknown';
  rounds: number | null;
  movements: string[];
  times: number[] | null;
  reps: number[] | null;
  confidence: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

