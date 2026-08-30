-- Rename leftover category-era index names on topics tables.

ALTER INDEX IF EXISTS app.theory_categories_active_idx RENAME TO topics_active_idx;
ALTER INDEX IF EXISTS app.theory_question_categories_category_id_idx RENAME TO theory_question_topics_topic_id_idx;
