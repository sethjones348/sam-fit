-- Migration: Add metadata column to workouts table
-- This allows storing additional metadata like rawGeminiText for debugging

-- Add metadata JSONB column to workouts table
ALTER TABLE workouts 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN workouts.metadata IS 'Additional workout metadata (e.g., rawGeminiText for debugging)';

