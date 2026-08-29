-- Change response and notes from text to jsonb
-- No existing attempts, so no USING conversion needed for data
ALTER TABLE app.theory_attempts
  ALTER COLUMN response TYPE jsonb USING response::jsonb;

ALTER TABLE app.theory_attempts
  ALTER COLUMN notes TYPE jsonb USING notes::jsonb;