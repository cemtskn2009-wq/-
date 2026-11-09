-- Run this in Supabase SQL Editor before using the app.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  idea text not null,
  format text not null check (format in ('long','shorts')),
  content_language text not null check (content_language in ('ar','en')),
  target_duration_minutes integer not null default 8,
  status text not null default 'script_draft' check (status in ('script_draft','script_review','image_review','ready_to_render','rendering','completed','failed')),
  script jsonb,
  scenes jsonb not null default '[]'::jsonb,
  output_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare invite_role text := 'member';
begin
  if exists(select 1 from public.invitations where lower(email)=lower(new.email) and status='pending') then
    insert into public.profiles(id,email,role) values(new.id,new.email,invite_role)
    on conflict(id) do update set email=excluded.email;
    update public.invitations set status='accepted' where lower(email)=lower(new.email);
  else
    -- No invitation means no profile; public signups cannot enter the application.
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;

drop policy if exists "profile self or admin read" on public.profiles;
create policy "profile self or admin read" on public.profiles for select
using (id=auth.uid() or public.is_admin());

drop policy if exists "admin manage invitations" on public.invitations;
create policy "admin manage invitations" on public.invitations for all
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project owner read" on public.projects;
create policy "project owner read" on public.projects for select using (owner_id=auth.uid());
drop policy if exists "project owner insert" on public.projects;
create policy "project owner insert" on public.projects for insert with check (owner_id=auth.uid());
drop policy if exists "project owner update" on public.projects;
create policy "project owner update" on public.projects for update using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists "project owner delete" on public.projects;
create policy "project owner delete" on public.projects for delete using (owner_id=auth.uid());

-- IMPORTANT: after creating your own first account, promote it to admin manually:
-- update public.profiles set role='admin' where lower(email)=lower('YOUR_EMAIL');
-- Create a private Storage bucket named "private-videos". Keep it private (not public).
