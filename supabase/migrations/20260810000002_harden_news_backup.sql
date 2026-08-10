begin;

alter table public.news_backup drop constraint if exists news_backup_owner_fkey;

commit;
