do $$
begin
	if not exists (
		select 1
		from pg_policies
		where schemaname = 'public'
			and tablename = 'service_logs'
			and policyname = 'service_logs_vehicle_ownership'
	) then
		create policy "service_logs_vehicle_ownership"
			on public.service_logs
			for insert
			with check (
				exists (
					select 1
					from public.vehicles
					where public.vehicles.id = public.service_logs.vehicle_id
						and public.vehicles.user_id = auth.uid()
				)
			);
	end if;

	if not exists (
		select 1
		from pg_policies
		where schemaname = 'public'
			and tablename = 'service_alerts'
			and policyname = 'alerts_vehicle_ownership'
	) then
		create policy "alerts_vehicle_ownership"
			on public.service_alerts
			for insert
			with check (
				exists (
					select 1
					from public.vehicles
					where public.vehicles.id = public.service_alerts.vehicle_id
						and public.vehicles.user_id = auth.uid()
				)
			);
	end if;
end
$$;

create or replace function public.check_vehicle_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if (select count(*) from public.vehicles where user_id = new.user_id) >= 10 then
		raise exception 'Vehicle limit reached (max 10 per account)';
	end if;

	return new;
end;
$$;

do $$
begin
	if not exists (
		select 1
		from pg_trigger
		where tgname = 'enforce_vehicle_limit'
			and tgrelid = 'public.vehicles'::regclass
	) then
		create trigger enforce_vehicle_limit
		before insert on public.vehicles
		for each row execute function public.check_vehicle_limit();
	end if;
end
$$;

create or replace function public.check_log_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if (select count(*) from public.service_logs where vehicle_id = new.vehicle_id) >= 500 then
		raise exception 'Service log limit reached (max 500 per vehicle)';
	end if;

	return new;
end;
$$;

do $$
begin
	if not exists (
		select 1
		from pg_trigger
		where tgname = 'enforce_log_limit'
			and tgrelid = 'public.service_logs'::regclass
	) then
		create trigger enforce_log_limit
		before insert on public.service_logs
		for each row execute function public.check_log_limit();
	end if;
end
$$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'mileage_positive'
			and conrelid = 'public.vehicles'::regclass
	) then
		execute 'alter table public.vehicles add constraint mileage_positive check (current_mileage >= 0 and current_mileage < 10000000)';
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'interval_valid'
			and conrelid = 'public.vehicles'::regclass
	) then
		execute 'alter table public.vehicles add constraint interval_valid check (mileage_interval in (5000, 10000))';
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'log_mileage_positive'
			and conrelid = 'public.service_logs'::regclass
	) then
		execute 'alter table public.service_logs add constraint log_mileage_positive check (mileage_at_service >= 0 and mileage_at_service < 10000000)';
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'log_cost_positive'
			and conrelid = 'public.service_logs'::regclass
	) then
		execute 'alter table public.service_logs add constraint log_cost_positive check (service_cost is null or (service_cost >= 0 and service_cost < 10000000))';
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'log_rating_range'
			and conrelid = 'public.service_logs'::regclass
	) then
		execute 'alter table public.service_logs add constraint log_rating_range check (rating is null or (rating >= 1 and rating <= 5))';
	end if;
end
$$;