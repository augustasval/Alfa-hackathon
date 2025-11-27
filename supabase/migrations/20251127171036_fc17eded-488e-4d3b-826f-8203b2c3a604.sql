-- Add session statistics tracking columns to scheduled_sessions
ALTER TABLE scheduled_sessions 
ADD COLUMN exercises_completed integer DEFAULT 0,
ADD COLUMN mistakes_count integer DEFAULT 0;