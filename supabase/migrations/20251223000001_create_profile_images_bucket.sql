-- Create profile-images storage bucket (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-images', 'profile-images', true);
  END IF;
END $$;

-- Storage policies for profile-images bucket
-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile pictures" ON storage.objects;

-- Policy: Users can upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own profile pictures
CREATE POLICY "Users can read their own profile pictures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can read profile pictures (for displaying in feed, etc.)
CREATE POLICY "Public can read profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

