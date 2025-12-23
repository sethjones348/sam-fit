import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Workout } from '../types';
import { workoutStore } from '../store/workoutStore';
import WorkoutCard from '../components/WorkoutCard';
import SearchBar from '../components/SearchBar';

export default function WorkoutsPage() {
  const { isAuthenticated, user } = useAuth();
  const { workouts, loadWorkouts, isLoading, error } = workoutStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadWorkouts(user.id);
    }
  }, [isAuthenticated, user?.id, loadWorkouts]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkouts(workouts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = workouts.filter((workout) => {
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
  }, [searchQuery, workouts]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view your workouts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:pt-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8">
        <div className="mb-4 md:mb-8 px-4 md:px-0 bg-white md:bg-transparent border-b md:border-b-0 border-gray-200 md:border-0 py-3 md:py-0 sticky md:static top-0 z-30">
          <h1 className="text-xl md:text-3xl sm:text-4xl font-heading font-bold mb-3 md:mb-4">Your Workouts</h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 mx-4 md:mx-0">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cf-red mb-4"></div>
            <p className="text-lg text-gray-600">Loading workouts...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <p className="text-xl text-gray-600 mb-4">No workouts found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-cf-red hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-xl text-gray-600 mb-4">No workouts yet</p>
                <Link
                  to="/upload"
                  className="inline-block bg-cf-red text-white px-6 py-3 rounded font-semibold uppercase tracking-wider hover:bg-cf-red-hover transition-all"
                >
                  Upload Your First Workout
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-6">
            {filteredWorkouts.map((workout, index) => (
              <div 
                key={workout.id}
                className={`
                  ${index === 0 ? 'border-t-0' : 'border-t-2 md:border-t border-gray-300 md:border-gray-200'}
                  md:border-t-0
                  px-4 md:px-0
                  py-4 md:py-0
                  bg-white md:bg-transparent
                `}
              >
                <WorkoutCard workout={workout} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

