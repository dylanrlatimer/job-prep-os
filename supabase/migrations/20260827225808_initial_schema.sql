create schema app;

revoke all on schema app from public, anon, authenticated;

create type app.theory_attempt_result as enum (
  'incorrect',
  'partial',
  'correct'
);

create table app.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table app.theory_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  url text not null unique check (length(btrim(url)) > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table app.theory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  slug text not null unique check (length(btrim(slug)) > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table app.theory_questions (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references app.profiles (id),
  source_id uuid references app.theory_sources (id),
  source_url text,
  is_public boolean not null default false,
  question text not null check (length(btrim(question)) > 0),
  answer text not null check (length(btrim(answer)) > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table app.theory_question_categories (
  question_id uuid not null references app.theory_questions (id) on delete cascade,
  category_id uuid not null references app.theory_categories (id),
  primary key (question_id, category_id)
);

create table app.theory_library_items (
  profile_id uuid not null references app.profiles (id) on delete cascade,
  question_id uuid not null references app.theory_questions (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (profile_id, question_id)
);

create table app.theory_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references app.profiles (id) on delete cascade,
  question_id uuid not null references app.theory_questions (id),
  response text,
  result app.theory_attempt_result not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

create index theory_questions_owner_profile_id_idx
  on app.theory_questions (owner_profile_id);

create index theory_questions_source_id_idx
  on app.theory_questions (source_id);

create index theory_questions_public_idx
  on app.theory_questions (created_at desc)
  where is_public = true;

create index theory_question_categories_category_id_idx
  on app.theory_question_categories (category_id);

create index theory_library_items_question_id_idx
  on app.theory_library_items (question_id);

create index theory_attempts_profile_question_created_at_idx
  on app.theory_attempts (profile_id, question_id, created_at desc);

create index theory_attempts_question_id_idx
  on app.theory_attempts (question_id);

create function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on app.profiles
for each row execute function app.set_updated_at();

create trigger set_theory_sources_updated_at
before update on app.theory_sources
for each row execute function app.set_updated_at();

create trigger set_theory_categories_updated_at
before update on app.theory_categories
for each row execute function app.set_updated_at();

create trigger set_theory_questions_updated_at
before update on app.theory_questions
for each row execute function app.set_updated_at();

create function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name'
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_user();

insert into app.profiles (id, display_name)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'display_name',
    raw_user_meta_data ->> 'full_name'
  )
from auth.users
on conflict (id) do nothing;

revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;

alter default privileges in schema app
  revoke all on tables from public, anon, authenticated;

alter default privileges in schema app
  revoke all on sequences from public, anon, authenticated;

alter default privileges in schema app
  revoke all on functions from public, anon, authenticated;
