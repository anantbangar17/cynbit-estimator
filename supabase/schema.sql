create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  project_type text not null,
  features text[] not null default '{}',
  timeline text not null,
  price_min integer not null,
  price_max integer not null,
  days_min integer not null,
  days_max integer not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table estimates enable row level security; -- no public policies: only the server key can write
