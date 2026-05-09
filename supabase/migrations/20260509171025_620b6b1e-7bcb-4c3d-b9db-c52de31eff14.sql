create table public.distillation_datasets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  source_model text not null default 'gpt-4o',
  target_model text,
  status text not null default 'collecting' check (status in ('collecting','ready','fine_tuning','completed','failed')),
  pair_count integer not null default 0,
  auto_capture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.distillation_pairs (
  id uuid default gen_random_uuid() primary key,
  dataset_id uuid references public.distillation_datasets(id) on delete cascade not null,
  prompt text not null,
  response text not null,
  system_prompt text,
  category text,
  token_count_input integer,
  token_count_output integer,
  quality_score float,
  created_at timestamptz not null default now()
);

create table public.distillation_jobs (
  id uuid default gen_random_uuid() primary key,
  dataset_id uuid references public.distillation_datasets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('openai','together','custom')),
  base_model text not null,
  fine_tuned_model_id text,
  fine_tuned_endpoint text,
  status text not null default 'pending' check (status in ('pending','queued','training','completed','failed')),
  training_cost_usd float,
  epochs integer default 3,
  learning_rate_multiplier float default 1.0,
  provider_job_id text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.distillation_routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_model text not null,
  distilled_model text not null,
  distilled_endpoint text,
  provider text not null,
  active boolean not null default true,
  confidence_threshold float not null default 0.85,
  requests_routed integer not null default 0,
  requests_escalated integer not null default 0,
  cost_saved_usd float not null default 0,
  created_at timestamptz not null default now()
);

alter table public.distillation_datasets enable row level security;
alter table public.distillation_pairs enable row level security;
alter table public.distillation_jobs enable row level security;
alter table public.distillation_routes enable row level security;

-- Datasets
create policy "Users view own datasets" on public.distillation_datasets for select using (auth.uid() = user_id);
create policy "Users insert own datasets" on public.distillation_datasets for insert with check (auth.uid() = user_id);
create policy "Users update own datasets" on public.distillation_datasets for update using (auth.uid() = user_id);
create policy "Users delete own datasets" on public.distillation_datasets for delete using (auth.uid() = user_id);

-- Pairs (via parent dataset)
create policy "Users view own pairs" on public.distillation_pairs for select using (
  exists (select 1 from public.distillation_datasets d where d.id = dataset_id and d.user_id = auth.uid())
);
create policy "Users insert own pairs" on public.distillation_pairs for insert with check (
  exists (select 1 from public.distillation_datasets d where d.id = dataset_id and d.user_id = auth.uid())
);
create policy "Users delete own pairs" on public.distillation_pairs for delete using (
  exists (select 1 from public.distillation_datasets d where d.id = dataset_id and d.user_id = auth.uid())
);

-- Jobs
create policy "Users view own jobs" on public.distillation_jobs for select using (auth.uid() = user_id);
create policy "Users insert own jobs" on public.distillation_jobs for insert with check (auth.uid() = user_id);
create policy "Users update own jobs" on public.distillation_jobs for update using (auth.uid() = user_id);
create policy "Users delete own jobs" on public.distillation_jobs for delete using (auth.uid() = user_id);

-- Routes
create policy "Users view own routes" on public.distillation_routes for select using (auth.uid() = user_id);
create policy "Users insert own routes" on public.distillation_routes for insert with check (auth.uid() = user_id);
create policy "Users update own routes" on public.distillation_routes for update using (auth.uid() = user_id);
create policy "Users delete own routes" on public.distillation_routes for delete using (auth.uid() = user_id);

create index on public.distillation_pairs(dataset_id);
create index on public.distillation_jobs(user_id);
create index on public.distillation_datasets(user_id);
create index on public.distillation_routes(user_id);