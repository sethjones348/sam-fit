import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Workout } from '../types';

interface WorkoutDB extends DBSchema {
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-date': string };
  };
}

let db: IDBPDatabase<WorkoutDB> | null = null;

async function getDB(): Promise<IDBPDatabase<WorkoutDB>> {
  if (db) return db;

  db = await openDB<WorkoutDB>('wodsapp-workouts', 1, {
    upgrade(database) {
      const store = database.createObjectStore('workouts', {
        keyPath: 'id',
      });
      store.createIndex('by-date', 'date');
    },
  });

  return db;
}

export const workoutCache = {
  async saveWorkout(workout: Workout): Promise<void> {
    const database = await getDB();
    await database.put('workouts', workout);
  },

  async loadWorkouts(): Promise<Workout[]> {
    const database = await getDB();
    const workouts = await database.getAll('workouts');
    
    // Generate default names for old workouts that don't have one
    const workoutsWithNames = workouts.map(workout => {
      if (!workout.name) {
        // Use first line of raw text, or fallback to rounds-type format
        if (workout.rawText && workout.rawText.length > 0 && workout.rawText[0].trim()) {
          workout.name = workout.rawText[0].trim();
        } else {
          const rounds = workout.extractedData.rounds || 0;
          const type = workout.extractedData.type === 'unknown' 
            ? 'Workout' 
            : workout.extractedData.type.charAt(0).toUpperCase() + workout.extractedData.type.slice(1);
          workout.name = rounds > 0 ? `${rounds}-${type} Workout` : `${type} Workout`;
        }
      }
      return workout;
    });
    
    return workoutsWithNames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

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
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    const database = await getDB();
    await database.delete('workouts', workoutId);
  },

  async clearCache(): Promise<void> {
    const database = await getDB();
    await database.clear('workouts');
  },
};

