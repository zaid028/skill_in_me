create extension if not exists "pgcrypto";

create type public.priority as enum ('P1', 'P2', 'P3', 'P4');
create type public.member_role as enum ('owner', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text,
  timezone text not null default 'UTC',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notification_preferences jsonb not null default '{"email": true, "browser": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null default '#65ab8c',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references public.lists(id) on delete set null,
  title text not null check (char_length(title) between 1 and 500),
  description text,
  notes text,
  priority public.priority not null default 'P4',
  due_at timestamptz,
  completed_at timestamptz,
  completed boolean not null default false,
  is_archived boolean not null default false,
  is_favorite boolean not null default false,
  position numeric not null default 0,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_members (
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index todos_owner_status_idx on public.todos (owner_id, completed, is_archived);
create index todos_due_at_idx on public.todos (owner_id, due_at) where completed = false and is_archived = false;
create index todos_list_position_idx on public.todos (list_id, position);
create index list_members_user_idx on public.list_members (user_id, list_id);

create or replace function public.is_list_member(target_list_id uuid, required_role public.member_role default 'viewer')
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.list_members
    where list_id = target_list_id and user_id = auth.uid()
      and case required_role when 'viewer' then role in ('owner', 'editor', 'viewer') when 'editor' then role in ('owner', 'editor') when 'owner' then role = 'owner' end
  );
$$;

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.todos enable row level security;
alter table public.list_members enable row level security;

create policy "profiles are private" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "owners and members can read lists" on public.lists for select using (owner_id = auth.uid() or public.is_list_member(id));
create policy "users create their own lists" on public.lists for insert with check (owner_id = auth.uid());
create policy "owners update lists" on public.lists for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete lists" on public.lists for delete using (owner_id = auth.uid());
create policy "authorized users read todos" on public.todos for select using (owner_id = auth.uid() or (list_id is not null and public.is_list_member(list_id)));
create policy "users create todos" on public.todos for insert with check (owner_id = auth.uid() and (list_id is null or public.is_list_member(list_id, 'editor')));
create policy "authorized users update todos" on public.todos for update using (owner_id = auth.uid() or (list_id is not null and public.is_list_member(list_id, 'editor'))) with check (owner_id = auth.uid() or (list_id is not null and public.is_list_member(list_id, 'editor')));
create policy "owners delete todos" on public.todos for delete using (owner_id = auth.uid());
create policy "members read membership" on public.list_members for select using (user_id = auth.uid() or public.is_list_member(list_id, 'owner'));
create policy "owners manage membership" on public.list_members for all using (public.is_list_member(list_id, 'owner')) with check (public.is_list_member(list_id, 'owner'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();