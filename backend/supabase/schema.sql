create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null unique,
  password_hash text not null,
  role text not null default 'reader' check (role in ('reader', 'author', 'admin')),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar text not null default '',
  subscribed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  excerpt text not null default '',
  tags text[] not null default '{}',
  cover_image text not null default '',
  category text not null default 'Uncategorized',
  subcategory text not null default '',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at timestamptz,
  slug text unique,
  meta_title text not null default '' check (char_length(meta_title) <= 70),
  meta_description text not null default '' check (char_length(meta_description) <= 160),
  author_id uuid not null references public.users(id) on delete cascade,
  views integer not null default 0 check (views >= 0),
  revisions jsonb not null default '[]'::jsonb,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 5000),
  author_id uuid references public.users(id) on delete set null,
  guest_name text not null default '' check (char_length(guest_name) <= 80),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'flagged', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) > 0),
  parent_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_created_at_idx on public.posts(status, created_at desc);
create index if not exists posts_author_updated_at_idx on public.posts(author_id, updated_at desc);
create index if not exists posts_search_vector_idx on public.posts using gin(search_vector);
create index if not exists comments_post_status_created_at_idx on public.comments(post_id, status, created_at);
create index if not exists comments_status_created_at_idx on public.comments(status, created_at desc);
create index if not exists categories_parent_id_idx on public.categories(parent_id);

create or replace function public.increment_post_views(target_post_id uuid)
returns integer
language sql
security invoker
set search_path = public
as $$
  update posts
  set views = views + 1
  where id = target_post_id
  returning views;
$$;

create or replace function public.total_post_views()
returns bigint
language sql
security invoker
set search_path = public
as $$
  select coalesce(sum(views), 0)::bigint from posts;
$$;

revoke all on function public.increment_post_views(uuid) from public;
grant execute on function public.increment_post_views(uuid) to service_role;
revoke all on function public.total_post_views() from public;
grant execute on function public.total_post_views() to service_role;

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
