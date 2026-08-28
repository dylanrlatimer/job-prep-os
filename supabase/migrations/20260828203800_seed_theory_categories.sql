insert into app.theory_categories (name, slug)
values
  ('Uncategorized', 'uncategorized'),
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('HTML', 'html'),
  ('CSS', 'css'),
  ('Browser APIs', 'browser-apis'),
  ('React', 'react'),
  ('Next.js', 'nextjs'),
  ('Node.js', 'nodejs'),
  ('SQL', 'sql'),
  ('PostgreSQL', 'postgresql'),
  ('HTTP & Networking', 'http-networking'),
  ('Testing', 'testing'),
  ('Web Security', 'web-security'),
  ('Accessibility', 'accessibility'),
  ('Software Engineering', 'software-engineering')
on conflict (slug) do update
set name = excluded.name;
