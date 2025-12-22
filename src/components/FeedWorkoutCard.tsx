import { Link } from 'react-router-dom';
import { Workout } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import FistBumpButton from './FistBumpButton';

interface FeedWorkoutCardProps {
  workout: Workout;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

export default function FeedWorkoutCard({ workout, user }: FeedWorkoutCardProps) {
  const workoutDate = new Date(workout.date);
  const timeAgo = formatDistanceToNow(workoutDate, { addSuffix: true });
  
  // Ensure we have user data or use fallback
  const displayName = user?.name || 'Unknown User';
  const displayInitial = displayName[0]?.toUpperCase() || '?';
  const userId = user?.id || workout.userId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">
      {/* User Header - Strava style */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/profile/${userId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  // If image fails to load, replace with default avatar
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const defaultAvatar = document.createElement('div');
                  defaultAvatar.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-cf-red to-cf-red-hover flex items-center justify-center border-2 border-gray-200';
                  defaultAvatar.innerHTML = `<span class="text-white text-sm font-bold">${displayInitial}</span>`;
                  target.parentElement?.appendChild(defaultAvatar);
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cf-red to-cf-red-hover flex items-center justify-center border-2 border-gray-200">
                <span className="text-white text-sm font-bold">
                  {displayInitial}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link
              to={`/profile/${userId}`}
              className="font-semibold text-black hover:text-cf-red transition-colors block"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
            <span className="text-xs text-gray-600">{timeAgo}</span>
          </div>
        </div>
        <span className="text-xs text-gray-600 uppercase tracking-wider">
          {format(workoutDate, 'MMM d, yyyy')}
        </span>
      </div>

      {/* Workout Image - Strava style large image */}
      {workout.imageUrl && (
        <Link to={`/workout/${workout.id}`} className="block">
          <div className="w-full aspect-video bg-gray-100 overflow-hidden">
            <img
              src={workout.imageUrl}
              alt={workout.name || 'Workout'}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
        </Link>
      )}

      {/* Workout Content */}
      <div className="px-4 py-4">
        <Link to={`/workout/${workout.id}`} className="block">
          <h3 className="text-xl font-heading font-bold text-black mb-2 hover:text-cf-red transition-colors">
            {workout.name || 'Workout'}
          </h3>

          {/* Workout Stats - Strava style badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {workout.extractedData.type !== 'unknown' && (
              <span className="inline-flex items-center bg-cf-red text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                {workout.extractedData.type}
              </span>
            )}
            {workout.extractedData.rounds && (
              <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {workout.extractedData.rounds} rounds
              </span>
            )}
          </div>

          {/* Movements - Strava style list */}
          {workout.extractedData.movements.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {workout.extractedData.movements.join(' • ')}
              </p>
            </div>
          )}

          {/* Raw Text Preview - Strava style description */}
          {workout.rawText.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs text-gray-600 font-mono line-clamp-2">
                {workout.rawText.join(' | ')}
              </p>
            </div>
          )}
        </Link>

        {/* Social Actions - Strava style bottom bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
          <FistBumpButton workoutId={workout.id} />
          <Link
            to={`/workout/${workout.id}#comments`}
            className="flex items-center space-x-2 text-gray-600 hover:text-cf-red transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">Comment</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

