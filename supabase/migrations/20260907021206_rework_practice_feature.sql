alter table app.profiles
  add column exercise_ratio smallint not null default 60
  constraint profiles_exercise_ratio_check check (exercise_ratio between 0 and 100);

alter table app.practice_sessions
  add column exercise_ratio smallint not null default 60
  constraint practice_sessions_exercise_ratio_check check (exercise_ratio between 0 and 100);

update app.practice_sessions
set exercise_ratio = case content_filter
  when 'theory' then 0
  when 'exercises' then 100
  else 50
end;

create table app.practice_session_topics (
  session_id uuid not null references app.practice_sessions (id) on delete cascade,
  topic_id uuid not null references app.topics (id),
  requested_count smallint not null check (requested_count > 0),
  primary key (session_id, topic_id)
);

create index practice_session_topics_topic_id_idx
  on app.practice_session_topics (topic_id);

alter table app.practice_session_topics enable row level security;

insert into app.practice_session_topics (session_id, topic_id, requested_count)
select s.id, t.id, 1
from app.practice_sessions s
cross join lateral unnest(s.topic_ids) as raw_id
join app.topics t on t.id = raw_id
on conflict do nothing;

insert into app.practice_session_topics (session_id, topic_id, requested_count)
select distinct i.session_id, qt.topic_id, 1
from app.practice_session_items i
join app.theory_question_topics qt
  on i.content_type = 'theory'
 and qt.question_id = i.content_id
join app.topics t on t.id = qt.topic_id
on conflict do nothing;

insert into app.practice_session_topics (session_id, topic_id, requested_count)
select distinct i.session_id, et.topic_id, 1
from app.practice_session_items i
join app.exercise_topics et
  on i.content_type = 'exercise'
 and et.exercise_id = i.content_id
join app.topics t on t.id = et.topic_id
on conflict do nothing;

update app.practice_session_topics pst
set requested_count = greatest(src.n, 1)
from (
  select session_id, topic_id, count(*)::smallint as n
  from (
    select i.session_id, qt.topic_id
    from app.practice_session_items i
    join app.theory_question_topics qt
      on i.content_type = 'theory'
     and qt.question_id = i.content_id
    union all
    select i.session_id, et.topic_id
    from app.practice_session_items i
    join app.exercise_topics et
      on i.content_type = 'exercise'
     and et.exercise_id = i.content_id
  ) tagged
  group by session_id, topic_id
) src
where pst.session_id = src.session_id
  and pst.topic_id = src.topic_id;

alter table app.practice_session_items
  add column topic_id uuid references app.topics (id);

create index practice_session_items_topic_id_idx
  on app.practice_session_items (topic_id)
  where topic_id is not null;

alter table app.practice_sessions
  drop column topic_ids,
  drop column content_filter;
