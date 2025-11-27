-- Add completion tracking columns to custom_exercises table
ALTER TABLE custom_exercises 
ADD COLUMN is_completed boolean DEFAULT false,
ADD COLUMN completed_at timestamp with time zone;