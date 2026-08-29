ALTER TABLE app.exercises ADD COLUMN title text;

UPDATE app.exercises SET title = 'Untitled exercise' WHERE title IS NULL;

ALTER TABLE app.exercises ALTER COLUMN title SET NOT NULL;

ALTER TABLE app.exercises
  ADD CONSTRAINT exercises_title_check CHECK (char_length(btrim(title)) > 0);