alter table app.theory_questions
  drop constraint if exists theory_questions_source_id_fkey;

drop index if exists app.theory_questions_source_id_idx;

alter table app.theory_questions
  drop column if exists source_id;

alter table app.theory_questions
  add column source_name text;

drop trigger if exists set_theory_sources_updated_at on app.theory_sources;

drop table if exists app.theory_sources;
