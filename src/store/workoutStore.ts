import { create } from 'zustand';
import { Workout, WorkoutExtraction } from '../types';
import { driveStorage } from '../services/driveStorage';
import { workoutCache } from '../services/workoutCache';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutStore {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;
  loadWorkouts: () => Promise<void>;
  saveWorkout: (extraction: WorkoutExtraction & { imageUrl: string }) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  syncFromDrive: () => Promise<void>;
}

export const workoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],
  isLoading: false,
  error: null,

  loadWorkouts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try cache first
      const cachedWorkouts = await workoutCache.loadWorkouts();
      
      // If cache has workouts, show them immediately and sync in background
      if (cachedWorkouts.length > 0) {
        set({ workouts: cachedWorkouts, isLoading: false });
        // Sync from Drive in background
        get().syncFromDrive();
      } else {
        // Cache is empty, load from Drive and wait for it
        try {
          const driveWorkouts = await driveStorage.loadWorkouts();
          set({ workouts: driveWorkouts, isLoading: false });
          // Update cache
          for (const workout of driveWorkouts) {
            await workoutCache.saveWorkout(workout);
          }
        } catch (driveError) {
          set({
            error: driveError instanceof Error ? driveError.message : 'Failed to load workouts',
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load workouts from cache:', error);
      // Fallback to Drive
      try {
        const driveWorkouts = await driveStorage.loadWorkouts();
        set({ workouts: driveWorkouts, isLoading: false });
        // Update cache
        for (const workout of driveWorkouts) {
          await workoutCache.saveWorkout(workout);
        }
      } catch (driveError) {
        set({
          error: driveError instanceof Error ? driveError.message : 'Failed to load workouts',
          isLoading: false,
        });
      }
    }
  },

  saveWorkout: async (extraction) => {
    set({ isLoading: true, error: null });
    try {
      // Generate default name if not provided
      const generateDefaultName = (): string => {
        // Use first line of raw text, or fallback to rounds-type format
        if (extraction.rawText && extraction.rawText.length > 0 && extraction.rawText[0].trim()) {
          return extraction.rawText[0].trim();
        }
        const rounds = extraction.rounds || 0;
        const type = extraction.type === 'unknown' ? 'Workout' : extraction.type.charAt(0).toUpperCase() + extraction.type.slice(1);
        return rounds > 0 ? `${rounds}-${type} Workout` : `${type} Workout`;
      };

      const workout: Workout = {
        id: uuidv4(),
        name: extraction.name?.trim() || generateDefaultName(),
        date: new Date().toISOString(),
        rawText: extraction.rawText,
        extractedData: {
          type: extraction.type,
          rounds: extraction.rounds,
          movements: extraction.movements,
          times: extraction.times,
          reps: extraction.reps,
        },
        imageUrl: extraction.imageUrl,
        metadata: {
          confidence: extraction.confidence,
        },
      };

      // Save to both Drive and cache
      await Promise.all([
        driveStorage.saveWorkout(workout),
        workoutCache.saveWorkout(workout),
      ]);

      set((state) => ({
        workouts: [workout, ...state.workouts],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save workout',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWorkout: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        driveStorage.deleteWorkout(id),
        workoutCache.deleteWorkout(id),
      ]);

      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete workout',
        isLoading: false,
      });
      throw error;
    }
  },

  syncFromDrive: async () => {
    try {
      const driveWorkouts = await driveStorage.loadWorkouts();
      
      // Update cache
      await workoutCache.clearCache();
      for (const workout of driveWorkouts) {
        await workoutCache.saveWorkout(workout);
      }

      set({ workouts: driveWorkouts });
    } catch (error) {
      console.error('Failed to sync from Drive:', error);
    }
  },
}));

