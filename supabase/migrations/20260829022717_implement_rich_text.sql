-- Drop the text-specific check constraint (validation moves to application layer)
ALTER TABLE app.theory_questions
  DROP CONSTRAINT theory_questions_answer_check;

-- Change answer column from text to jsonb
ALTER TABLE app.theory_questions
  ALTER COLUMN answer TYPE jsonb USING answer::jsonb;
