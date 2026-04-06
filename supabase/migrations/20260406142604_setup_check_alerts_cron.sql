-- Enable required extensions for scheduled HTTP calls.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Store browser push subscriptions per user/device.
create table if not exists public.push_subscriptions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	endpoint text not null unique,
	p256dh text not null,
	auth text not null,
	created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

do $$
begin
	if not exists (
		select 1
		from pg_policies
		where schemaname = 'public'
			and tablename = 'push_subscriptions'
			and policyname = 'Users see own push subscriptions'
	) then
		create policy "Users see own push subscriptions"
			on public.push_subscriptions
			for select
			using (auth.uid() = user_id);
	end if;

	if not exists (
		select 1
		from pg_policies
		where schemaname = 'public'
			and tablename = 'push_subscriptions'
			and policyname = 'Users manage own push subscriptions'
	) then
		create policy "Users manage own push subscriptions"
			on public.push_subscriptions
			for all
			using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;
end
$$;

-- Replace any previous cron schedule with the same name.
do $$
declare
	existing_job_id bigint;
begin
	select jobid
		into existing_job_id
	from cron.job
	where jobname = 'check-alerts-daily';

	if existing_job_id is not null then
		perform cron.unschedule(existing_job_id);
	end if;
end
$$;

-- Runs daily at 07:00 UTC and invokes Edge Function.
select
	cron.schedule(
		'check-alerts-daily',
		'0 7 * * *',
		$$
		select
			net.http_post(
				url := 'https://rmfkykcijcndwvsursmu.functions.supabase.co/check-alerts',
				headers := '{"Content-Type": "application/json"}'::jsonb,
				body := '{}'::jsonb
			);
		$$
	);
