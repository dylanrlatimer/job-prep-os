alter table app.topics
  add column icon_key text;

update app.topics set icon_key = 'javascript' where slug = 'javascript';
update app.topics set icon_key = 'typescript' where slug = 'typescript';
update app.topics set icon_key = 'html' where slug = 'html';
update app.topics set icon_key = 'css' where slug = 'css';
update app.topics set icon_key = 'react' where slug = 'react';
update app.topics set icon_key = 'nextjs' where slug = 'nextjs';
update app.topics set icon_key = 'nodejs' where slug = 'nodejs';
update app.topics set icon_key = 'postgresql' where slug = 'postgresql';
update app.topics set icon_key = 'sql' where slug = 'sql';
update app.topics set icon_key = 'globe' where slug = 'browser-apis';
update app.topics set icon_key = 'network' where slug = 'http-networking';
update app.topics set icon_key = 'flask-conical' where slug = 'testing';
update app.topics set icon_key = 'shield' where slug = 'web-security';
update app.topics set icon_key = 'accessibility' where slug = 'accessibility';
update app.topics set icon_key = 'layers' where slug = 'software-engineering';
update app.topics set icon_key = 'folder' where slug = 'uncategorized';
