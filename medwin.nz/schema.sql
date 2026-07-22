-- medwin.nz — projects database schema (Supabase / Postgres)
--
-- This is documentation of what was provisioned in the Supabase project
-- `medwin-nz` (ref ruvwewscxjmnrqsggoys). It has already been applied. Keep it
-- here so the setup is recorded and reproducible.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id           bigint generated always as identity primary key,
  title        text not null,
  description  text,                                   -- short card blurb
  body         text,                                   -- longer HTML detail for the modal
  link         text,                                   -- external "live" link
  image_url    text,                                   -- Supabase Storage public URL (optional)
  tags         jsonb   not null default '[]'::jsonb,   -- array of short strings
  category     text,                                   -- suffix in the card number line, e.g. "Full-stack"
  featured     boolean not null default false,         -- show on the homepage grid
  sort_order   integer not null default 0,             -- lower = earlier
  visible      boolean not null default true,          -- hide without deleting
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at fresh on edits.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index if not exists projects_public_order_idx
  on public.projects (featured desc, sort_order asc, created_at desc)
  where visible = true;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   • anon (public site visitors) may READ visible rows only
--   • the admin account (identified by email) may READ all rows and WRITE
-- Writes are gated on a specific email rather than "any authenticated user",
-- so enabling/disabling public sign-ups has no bearing on write security.
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "public_read_visible"
  on public.projects for select to anon using (visible = true);

create policy "admin_read_all"
  on public.projects for select to authenticated
  using ((auth.jwt() ->> 'email') = 'oli@medwin.nz');

create policy "admin_insert"
  on public.projects for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'oli@medwin.nz');

create policy "admin_update"
  on public.projects for update to authenticated
  using ((auth.jwt() ->> 'email') = 'oli@medwin.nz')
  with check ((auth.jwt() ->> 'email') = 'oli@medwin.nz');

create policy "admin_delete"
  on public.projects for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'oli@medwin.nz');

-- ---------------------------------------------------------------------------
-- Storage: public bucket for project thumbnails
--   • public bucket → object URLs are readable by anyone (no SELECT policy
--     needed; omitting it also prevents anonymous *listing* of the bucket)
--   • only the authenticated admin may upload / replace / delete
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images', 'project-images', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admin_insert_project_images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'oli@medwin.nz');

create policy "admin_update_project_images"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'oli@medwin.nz')
  with check (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'oli@medwin.nz');

create policy "admin_delete_project_images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'oli@medwin.nz');
