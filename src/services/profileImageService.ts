import { supabase } from '../lib/supabase';

const PROFILE_IMAGES_BUCKET = 'profile-images';

/**
 * Upload profile picture to Supabase Storage and return public URL
 */
export async function uploadProfilePicture(
  imageBase64: string,
  userId: string
): Promise<string> {
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  // Detect MIME type from base64 header
  let mimeType = 'image/png';
  if (imageBase64.includes(',')) {
    const header = imageBase64.split(',')[0];
    const mimeMatch = header.match(/data:([^;]+)/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }

  const blob = new Blob([byteArray], { type: mimeType });
  const fileExt = mimeType.split('/')[1] || 'png';
  const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

  // Delete old profile picture if it exists
  try {
    const { data: existingFiles } = await supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .list(userId, {
        search: 'profile-',
      });

    if (existingFiles && existingFiles.length > 0) {
      // Delete all old profile pictures
      const oldFileNames = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage
        .from(PROFILE_IMAGES_BUCKET)
        .remove(oldFileNames);
    }
  } catch (error) {
    // Ignore errors when deleting old files
    console.warn('Failed to delete old profile picture:', error);
  }

  // Upload new profile picture
  const { data, error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Delete profile picture from Supabase Storage
 */
export async function deleteProfilePicture(imageUrl: string): Promise<void> {
  // Extract path from URL
  const urlParts = imageUrl.split('/storage/v1/object/public/');
  if (urlParts.length !== 2) {
    throw new Error('Invalid image URL format');
  }

  const pathParts = urlParts[1].split('/');
  const bucket = pathParts[0];
  const filePath = pathParts.slice(1).join('/');

  if (bucket !== PROFILE_IMAGES_BUCKET) {
    throw new Error('Image is not from profile-images bucket');
  }

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete profile picture: ${error.message}`);
  }
}

