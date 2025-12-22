import { Link } from 'react-router-dom';
import { Workout } from '../types';
import { format } from 'date-fns';

interface WorkoutCardProps {
  workout: Workout;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Link to={`/workout/${workout.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-heading font-bold text-black">
            {workout.name || 'Workout'}
          </h3>
          <span className="text-sm text-gray-600 uppercase tracking-wider">
            {format(new Date(workout.date), 'MMM d')}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {workout.extractedData.type !== 'unknown' && (
            <span className="inline-block bg-cf-red text-white text-xs px-2 py-1 rounded uppercase tracking-wider">
              {workout.extractedData.type}
            </span>
          )}
          {workout.extractedData.rounds && (
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded ml-2">
              {workout.extractedData.rounds} rounds
            </span>
          )}
        </div>

        {workout.extractedData.movements.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {workout.extractedData.movements.join(' • ')}
            </p>
          </div>
        )}

        {workout.rawText.length > 0 && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-600 font-mono line-clamp-3">
              {workout.rawText.join(' | ')}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

