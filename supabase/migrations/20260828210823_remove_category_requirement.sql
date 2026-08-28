delete from app.theory_question_categories
where category_id in (
  select id
  from app.theory_categories
  where slug = 'uncategorized'
);

delete from app.theory_categories
where slug = 'uncategorized';
