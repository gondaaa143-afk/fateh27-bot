-- SAMBHAV UPSC • Supabase backend schema
-- Run this in the SAMBHAV Supabase project's SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  plan text not null default 'free' check (plan in ('free','demo','premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pyqs (
  id uuid primary key default gen_random_uuid(),
  exam text not null default 'UPSC CSE',
  stage text not null default 'Prelims' check (stage in ('Prelims','Mains')),
  year int not null,
  paper text not null default 'GS Paper I',
  subject text not null,
  topic text,
  question text not null,
  option_1 text not null,
  option_2 text not null,
  option_3 text not null,
  option_4 text not null,
  correct_option smallint not null check (correct_option between 1 and 4),
  explanation_what text,
  explanation_why_correct text,
  explanation_option_1 text,
  explanation_option_2 text,
  explanation_option_3 text,
  explanation_option_4 text,
  keywords text[],
  prelims_use text,
  mains_use text,
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  source text default 'UPSC official question paper',
  source_year int,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pyq_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pyq_id uuid not null references public.pyqs(id) on delete cascade,
  selected_option smallint check (selected_option between 1 and 4),
  is_correct boolean,
  time_spent_seconds int default 0,
  attempted_at timestamptz not null default now()
);

create table if not exists public.saved_pyqs (
  user_id uuid not null references auth.users(id) on delete cascade,
  pyq_id uuid not null references public.pyqs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pyq_id)
);

create index if not exists pyqs_year_idx on public.pyqs(year);
create index if not exists pyqs_subject_idx on public.pyqs(subject);
create index if not exists pyqs_topic_idx on public.pyqs(topic);
create index if not exists pyqs_stage_idx on public.pyqs(stage);
create index if not exists pyq_attempts_user_idx on public.pyq_attempts(user_id);
create index if not exists pyq_attempts_pyq_idx on public.pyq_attempts(pyq_id);

alter table public.profiles enable row level security;
alter table public.pyqs enable row level security;
alter table public.pyq_attempts enable row level security;
alter table public.saved_pyqs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "pyqs_read_authenticated" on public.pyqs for select to authenticated using (true);

create policy "attempts_select_own" on public.pyq_attempts for select using (auth.uid() = user_id);
create policy "attempts_insert_own" on public.pyq_attempts for insert with check (auth.uid() = user_id);

create policy "saved_select_own" on public.saved_pyqs for select using (auth.uid() = user_id);
create policy "saved_insert_own" on public.saved_pyqs for insert with check (auth.uid() = user_id);
create policy "saved_delete_own" on public.saved_pyqs for delete using (auth.uid() = user_id);

-- Auto-create a profile whenever a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
