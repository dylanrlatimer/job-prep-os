-- Enable RLS on every app table as a default-deny safety net.
-- No policies. No grant changes.
-- Not using FORCE ROW LEVEL SECURITY — the trusted server connection and
-- SECURITY DEFINER functions must continue to bypass RLS without policies.

alter table app.profiles enable row level security;

alter table app.theory_categories enable row level security;

alter table app.theory_questions enable row level security;

alter table app.theory_question_categories enable row level security;

alter table app.theory_library_items enable row level security;

alter table app.theory_attempts enable row level security;
