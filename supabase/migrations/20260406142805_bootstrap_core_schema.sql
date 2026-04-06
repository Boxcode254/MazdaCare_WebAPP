create extension if not exists pgcrypto;

create table if not exists public.vehicles (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	make text not null default 'Mazda',
	model text not null,
	year integer,
	fuel_type text check (fuel_type in ('petrol','diesel')),
	engine_size text,
	registration text,
	current_mileage integer default 0,
	mileage_interval integer default 5000 check (mileage_interval in (5000, 10000)),
	color text,
	created_at timestamptz default now()
);

create table if not exists public.garages (
	id uuid primary key default gen_random_uuid(),
	google_place_id text unique,
	name text not null,
	type text check (type in ('garage','petrol_station','dealer','mobile_mechanic')),
	address text,
	lat numeric,
	lng numeric,
	phone text,
	avg_rating numeric,
	total_reviews integer default 0,
	verified boolean default false,
	created_at timestamptz default now()
);

create table if not exists public.service_logs (
	id uuid primary key default gen_random_uuid(),
	vehicle_id uuid references public.vehicles(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	service_date date not null,
	service_type text check (service_type in ('minor','major','oil_change','tyre_rotation','brake_service','other')),
	mileage_at_service integer,
	next_service_mileage integer,
	oil_brand text,
	oil_grade text,
	oil_quantity_litres numeric,
	garage_id uuid references public.garages(id),
	garage_name text,
	service_cost numeric,
	notes text,
	rating integer check (rating between 1 and 5),
	created_at timestamptz default now()
);

create table if not exists public.service_alerts (
	id uuid primary key default gen_random_uuid(),
	vehicle_id uuid references public.vehicles(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	alert_type text check (alert_type in ('mileage','date','both')),
	due_mileage integer,
	due_date date,
	service_type text,
	is_dismissed boolean default false,
	created_at timestamptz default now()
);

alter table public.vehicles enable row level security;
alter table public.service_logs enable row level security;
alter table public.service_alerts enable row level security;
alter table public.garages enable row level security;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname='public' and tablename='vehicles' and policyname='Users see own vehicles'
	) then
		create policy "Users see own vehicles"
			on public.vehicles
			for all
			using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;

	if not exists (
		select 1 from pg_policies
		where schemaname='public' and tablename='service_logs' and policyname='Users see own logs'
	) then
		create policy "Users see own logs"
			on public.service_logs
			for all
			using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;

	if not exists (
		select 1 from pg_policies
		where schemaname='public' and tablename='service_alerts' and policyname='Users see own alerts'
	) then
		create policy "Users see own alerts"
			on public.service_alerts
			for all
			using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;

	if not exists (
		select 1 from pg_policies
		where schemaname='public' and tablename='garages' and policyname='Anyone can read garages'
	) then
		create policy "Anyone can read garages"
			on public.garages
			for select
			using (true);
	end if;

	if not exists (
		select 1 from pg_policies
		where schemaname='public' and tablename='garages' and policyname='Users can add garages'
	) then
		create policy "Users can add garages"
			on public.garages
			for insert
			with check (auth.uid() is not null);
	end if;
end
$$;
