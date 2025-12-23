import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userService';
import { getFollowing, getFollowers } from '../services/friendService';
import { workoutStore } from '../store/workoutStore';
import { Workout } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    workoutPrivacy: 'public' as 'public' | 'private',
  });
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const { workouts, loadWorkouts } = workoutStore();

  const userId = id || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
        if (userProfile) {
          setEditForm({
            name: userProfile.name,
            bio: userProfile.bio || '',
            workoutPrivacy: userProfile.settings.workoutPrivacy,
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadFriendCounts = async () => {
      try {
        if (isOwnProfile) {
          const [following, followers] = await Promise.all([
            getFollowing(),
            getFollowers(),
          ]);
          setFollowingCount(following.length);
          setFollowersCount(followers.length);
        } else {
          // For other users, we'd need to query their follows
          // For now, just show 0
          setFollowingCount(0);
          setFollowersCount(0);
        }
      } catch (error) {
        console.error('Failed to load friend counts:', error);
      }
    };

    const loadWeeklyWorkouts = async () => {
      if (!isOwnProfile || !userId) return;
      try {
        await loadWorkouts(userId);
      } catch (error) {
        console.error('Failed to load workouts:', error);
      }
    };

    loadProfile();
    loadFriendCounts();
    loadWeeklyWorkouts();
  }, [userId, isOwnProfile, loadWorkouts]);

  // Calculate weekly workout data
  useEffect(() => {
    if (!workouts || workouts.length === 0) {
      setWeeklyWorkouts([]);
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekWorkouts = workouts.filter((workout) => {
      const workoutDate = parseISO(workout.date);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    setWeeklyWorkouts(thisWeekWorkouts);
  }, [workouts]);

  // Create graph data for the week
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const graphData = weekDays.map((day) => {
    const dayWorkouts = weeklyWorkouts.filter((workout) => {
      const workoutDate = parseISO(workout.date);
      return format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    return {
      day: format(day, 'EEE'),
      date: format(day, 'MMM d'),
      count: dayWorkouts.length,
      workouts: dayWorkouts,
    };
  });

  const maxCount = Math.max(...graphData.map(d => d.count), 1);

  const handleSave = async () => {
    if (!userId || !isOwnProfile) return;

    try {
      const updated = await updateUserProfile(userId, {
        name: editForm.name,
        bio: editForm.bio || undefined,
        settings: {
          workoutPrivacy: editForm.workoutPrivacy,
          showEmail: profile?.settings?.showEmail || false,
        },
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view profiles.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cf-red"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:pt-20 md:pb-12 bg-gray-50 md:bg-white">
      <div className="max-w-4xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8">
        {/* Profile Header - Strava style */}
        <div className="bg-white md:border md:border-gray-200 md:rounded-lg md:shadow-md overflow-hidden">
          <div className="px-4 md:px-6 py-6 md:py-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-cf-red to-cf-red-hover flex items-center justify-center border-2 border-gray-200">
                    <span className="text-white text-xl md:text-2xl font-bold">
                      {profile.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  {isEditing && isOwnProfile ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-xl md:text-2xl font-heading font-bold border-2 border-cf-red rounded px-2 py-1"
                    />
                  ) : (
                    <h1 className="text-xl md:text-2xl sm:text-3xl font-heading font-bold">{profile.name}</h1>
                  )}
                  <p className="text-sm md:text-base text-gray-600">{profile.email}</p>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="bg-cf-red text-white px-4 py-2 rounded text-sm md:text-base font-semibold uppercase tracking-wider hover:bg-cf-red-hover transition-all min-h-[36px] md:min-h-[44px]"
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              )}
            </div>

            {/* Friend counts - Strava style */}
            {isOwnProfile && (
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="text-2xl md:text-3xl font-bold">{followingCount}</div>
                  <div className="text-xs md:text-sm text-gray-600">Following</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold">{followersCount}</div>
                  <div className="text-xs md:text-sm text-gray-600">Followers</div>
                </div>
              </div>
            )}

            {isEditing && isOwnProfile ? (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:border-cf-red outline-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider mb-2">
                    Workout Privacy
                  </label>
                  <select
                    value={editForm.workoutPrivacy}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        workoutPrivacy: e.target.value as 'public' | 'private',
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:border-cf-red outline-none min-h-[44px]"
                  >
                    <option value="public">Public (friends can see in feed)</option>
                    <option value="private">Private (no feed)</option>
                  </select>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {profile.bio && (
                  <div className="mb-4">
                    <p className="text-sm md:text-base text-gray-700">{profile.bio}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* This Week Section - Strava style */}
        {isOwnProfile && (
          <div className="bg-white md:border md:border-gray-200 md:rounded-lg md:shadow-md mt-4 md:mt-6 overflow-hidden">
            <div className="px-4 md:px-6 py-4 md:py-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg md:text-xl font-heading font-bold">This week</h2>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-4">{weeklyWorkouts.length}</div>
              
              {/* Weekly Graph */}
              <div className="mt-4">
                <div className="flex items-end justify-between gap-1 h-32">
                  {graphData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full bg-cf-red rounded-t transition-all"
                          style={{
                            height: `${(data.count / maxCount) * 100}%`,
                            minHeight: data.count > 0 ? '8px' : '0',
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        <div className="font-semibold">{data.day}</div>
                        <div className="text-[10px]">{data.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities Section - Strava style */}
        <div className="bg-white md:border md:border-gray-200 md:rounded-lg md:shadow-md mt-4 md:mt-6 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg md:text-xl font-heading font-bold">Activities</h2>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {weeklyWorkouts.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                {format(parseISO(weeklyWorkouts[0].date), 'MMMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
