-- PART 1: Vocabulary renames (all production data preserved in place)

ALTER TABLE app.theory_categories RENAME TO topics;
ALTER TABLE app.topics RENAME CONSTRAINT theory_categories_name_key TO topics_name_key;
ALTER TABLE app.topics RENAME CONSTRAINT theory_categories_slug_key TO topics_slug_key;
ALTER TABLE app.topics RENAME CONSTRAINT theory_categories_name_check TO topics_name_check;
ALTER TABLE app.topics RENAME CONSTRAINT theory_categories_slug_check TO topics_slug_check;

ALTER TABLE app.theory_question_categories RENAME TO theory_question_topics;
ALTER TABLE app.theory_question_topics RENAME COLUMN category_id TO topic_id;
ALTER TABLE app.theory_question_topics RENAME CONSTRAINT theory_question_categories_category_id_fkey TO theory_question_topics_topic_id_fkey;
ALTER TABLE app.theory_question_topics RENAME CONSTRAINT theory_question_categories_question_id_fkey TO theory_question_topics_question_id_fkey;
ALTER TABLE app.theory_question_topics RENAME CONSTRAINT theory_question_categories_pkey TO theory_question_topics_pkey;

ALTER TYPE app.theory_attempt_result RENAME TO attempt_result;

-- PART 2: New types and tables

CREATE TYPE app.exercise_type AS ENUM ('multiple_choice');

CREATE TABLE app.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid REFERENCES app.profiles(id),
  type app.exercise_type NOT NULL DEFAULT 'multiple_choice',
  prompt jsonb NOT NULL,
  explanation jsonb,
  is_public boolean NOT NULL DEFAULT false,
  allow_multiple boolean NOT NULL DEFAULT false,
  source_name text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercises_owner_profile_id_idx ON app.exercises (owner_profile_id);
CREATE INDEX exercises_public_idx ON app.exercises (created_at DESC) WHERE (is_public = true);

CREATE TABLE app.exercise_topics (
  exercise_id uuid NOT NULL REFERENCES app.exercises(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES app.topics(id),
  PRIMARY KEY (exercise_id, topic_id)
);
CREATE INDEX exercise_topics_topic_id_idx ON app.exercise_topics (topic_id);

CREATE TABLE app.exercise_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES app.exercises(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercise_choices_exercise_id_position_idx ON app.exercise_choices (exercise_id, position);

CREATE TABLE app.exercise_library_items (
  profile_id uuid NOT NULL REFERENCES app.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES app.exercises(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, exercise_id)
);
CREATE INDEX exercise_library_items_exercise_id_idx ON app.exercise_library_items (exercise_id);

CREATE TABLE app.exercise_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES app.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES app.exercises(id),
  selected_choice_ids jsonb NOT NULL,
  result app.attempt_result NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercise_attempts_profile_exercise_created_at_idx
  ON app.exercise_attempts (profile_id, exercise_id, created_at DESC);
CREATE INDEX exercise_attempts_exercise_id_idx ON app.exercise_attempts (exercise_id);