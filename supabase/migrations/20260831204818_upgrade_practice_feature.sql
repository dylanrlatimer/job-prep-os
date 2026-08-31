create type app.practice_content_type as enum ('theory', 'exercise');
create type app.practice_session_status as enum ('active', 'completed');

create table app.practice_sessions (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references app.profiles(id) on delete cascade,
  status         app.practice_session_status not null default 'active',
  topic_ids      uuid[] not null,
  content_filter text not null default 'all'
                   check (content_filter in ('all', 'theory', 'exercises')),
  created_at     timestamptz not null default now(),
  completed_at   timestamptz,
  updated_at     timestamptz not null default now()
);

create table app.practice_session_items (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references app.practice_sessions(id) on delete cascade,
  position            smallint not null,
  content_type        app.practice_content_type not null,
  content_id          uuid not null,
  theory_attempt_id   uuid references app.theory_attempts(id),
  exercise_attempt_id uuid references app.exercise_attempts(id),
  answered_at         timestamptz,
  skipped             boolean not null default false,
  created_at          timestamptz not null default now(),

  unique (session_id, position),
  unique (session_id, content_type, content_id)
);

create index practice_sessions_profile_status_idx
  on app.practice_sessions (profile_id, status);

create index practice_sessions_profile_completed_idx
  on app.practice_sessions (profile_id, completed_at desc)
  where status = 'completed';

create index practice_session_items_session_position_idx
  on app.practice_session_items (session_id, position);

create index practice_session_items_pending_idx
  on app.practice_session_items (session_id, position asc)
  where answered_at is null and skipped = false;

create trigger set_practice_sessions_updated_at
before update on app.practice_sessions
for each row execute function app.set_updated_at();

alter table app.practice_sessions enable row level security;
alter table app.practice_session_items enable row level security;
