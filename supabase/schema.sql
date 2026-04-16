create table if not exists public.app_users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.water_quality_records (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  station_name text not null,
  river text not null,
  municipality text not null,
  sampling_date date not null,
  ph numeric(5, 2) not null,
  dissolved_oxygen numeric(8, 2) not null,
  temperature numeric(8, 2) not null,
  status text not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists water_quality_records_user_id_idx
  on public.water_quality_records (user_id);

create index if not exists water_quality_records_updated_at_idx
  on public.water_quality_records (updated_at desc);
