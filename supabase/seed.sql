-- Optional sample data, so a new database isn't empty while you build.
--
-- Events need a real user to belong to, so this picks the first user in your
-- project. Sign up once in the app before running it, or it will do nothing.

insert into public.events (owner_id, title, description, starts_at)
select
  u.id,
  t.title,
  t.description,
  t.starts_at
from (select id from auth.users order by created_at limit 1) u
cross join (values
  ('ערב התנדבות', 'מפגש היכרות למתנדבים חדשים', now() + interval '7 days'),
  ('סדנת הכנה', 'סדנה למתנדבים ותיקים', now() + interval '21 days'),
  ('אסיפה שנתית', null, now() + interval '60 days')
) as t (title, description, starts_at)
where exists (select 1 from auth.users);
