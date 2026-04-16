create table if not exists public.app_users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workbooks (
  id text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  source_label text not null default 'Workbook Dashboard',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workbooks_user_id_idx
  on public.workbooks (user_id);

create index if not exists workbooks_updated_at_idx
  on public.workbooks (updated_at desc);
