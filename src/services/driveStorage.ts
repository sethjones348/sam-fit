import { Workout } from '../types';

const DRIVE_FOLDER_NAME = 'WODsApp';
const DRIVE_WORKOUTS_FOLDER = 'workouts';

let driveFolderId: string | null = null;
let workoutsFolderId: string | null = null;

async function getAccessToken(): Promise<string> {
  const token = sessionStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.error?.message || `API error: ${response.statusText}`;
    const statusCode = response.status;
    
    // Provide helpful error messages
    if (statusCode === 403) {
      throw new Error(
        `Drive API access denied (403). ` +
        `Please ensure: 1) Drive API is enabled in Google Cloud Console, ` +
        `2) You've granted Drive permissions during login, ` +
        `3) Try logging out and back in to refresh permissions. ` +
        `Error: ${errorMessage}`
      );
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

async function ensureFoldersExist(): Promise<void> {
  if (workoutsFolderId) return;

  // Find or create main folder
  const listResponse = await apiRequest(
    `/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const listData = await listResponse.json();

  if (listData.files && listData.files.length > 0) {
    driveFolderId = listData.files[0].id;
  } else {
    // Create main folder
    const createResponse = await apiRequest('/files', {
      method: 'POST',
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    const createData = await createResponse.json();
    driveFolderId = createData.id;
  }

  // Find or create workouts folder
  const workoutsListResponse = await apiRequest(
    `/files?q=name='${DRIVE_WORKOUTS_FOLDER}' and '${driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const workoutsListData = await workoutsListResponse.json();

  if (workoutsListData.files && workoutsListData.files.length > 0) {
    workoutsFolderId = workoutsListData.files[0].id;
  } else {
    const createWorkoutsResponse = await apiRequest('/files', {
      method: 'POST',
      body: JSON.stringify({
        name: DRIVE_WORKOUTS_FOLDER,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [driveFolderId!],
      }),
    });
    const createWorkoutsData = await createWorkoutsResponse.json();
    workoutsFolderId = createWorkoutsData.id;
  }
}

export const driveStorage = {
  async saveWorkout(workout: Workout): Promise<void> {
    await ensureFoldersExist();

    const fileName = `workout-${workout.date}-${workout.id}.json`;
    const fileContent = JSON.stringify(workout);

    // Check if file already exists
    const listResponse = await apiRequest(
      `/files?q=name='${fileName}' and '${workoutsFolderId}' in parents and trashed=false`
    );
    const listData = await listResponse.json();

    if (listData.files && listData.files.length > 0) {
      // Update existing file
      const fileId = listData.files[0].id;
      await apiRequest(`/files/${fileId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: fileName,
        }),
      });

      // Update file content
      const blob = new Blob([fileContent], { type: 'application/json' });
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify({
        name: fileName,
      })], { type: 'application/json' }));
      formData.append('file', blob);

      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: formData,
        }
      );
    } else {
      // Create new file
      const blob = new Blob([fileContent], { type: 'application/json' });
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify({
        name: fileName,
        parents: [workoutsFolderId!],
      })], { type: 'application/json' }));
      formData.append('file', blob);

      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: formData,
        }
      );
    }
  },

  async loadWorkouts(): Promise<Workout[]> {
    await ensureFoldersExist();

    const response = await apiRequest(
      `/files?q='${workoutsFolderId}' in parents and mimeType='application/json' and trashed=false&fields=files(id,name)`
    );
    const data = await response.json();

    if (!data.files || data.files.length === 0) {
      return [];
    }

    const workouts: Workout[] = [];

    for (const file of data.files) {
      try {
        const fileResponse = await apiRequest(`/files/${file.id}?alt=media`);
        const workout: Workout = await fileResponse.json();
        
        // Generate default name for old workouts that don't have one
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
        
        workouts.push(workout);
      } catch (error) {
        console.error(`Failed to load workout ${file.name}:`, error);
      }
    }

    return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    await ensureFoldersExist();

    const response = await apiRequest(
      `/files?q=name contains '${workoutId}' and '${workoutsFolderId}' in parents and trashed=false`
    );
    const data = await response.json();

    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        await apiRequest(`/files/${file.id}`, {
          method: 'DELETE',
        });
      }
    }
  },
};

