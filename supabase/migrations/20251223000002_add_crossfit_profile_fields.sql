-- Add CrossFit-related fields to users table
DO $$
BEGIN
  -- Add box_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'box_name') THEN
    ALTER TABLE users ADD COLUMN box_name TEXT;
  END IF;

  -- Add level column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level') THEN
    ALTER TABLE users ADD COLUMN level TEXT;
  END IF;

  -- Add favorite_movements column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'favorite_movements') THEN
    ALTER TABLE users ADD COLUMN favorite_movements TEXT[];
  END IF;

  -- Add prs column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'prs') THEN
    ALTER TABLE users ADD COLUMN prs JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN users.box_name IS 'Name of the CrossFit box/gym the user attends';
COMMENT ON COLUMN users.level IS 'CrossFit level: Beginner, Intermediate, Advanced, Rx, etc.';
COMMENT ON COLUMN users.favorite_movements IS 'Array of favorite CrossFit movements';
COMMENT ON COLUMN users.prs IS 'Personal records stored as JSON: {"Deadlift": "315 lbs", "Fran": "4:32"}';

