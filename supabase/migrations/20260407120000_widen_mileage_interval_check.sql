-- Widen the mileage_interval check constraint to allow 5000, 7000, 9000, 10000

-- Drop the original inline check from bootstrap (if it exists as a table check)
do $$
begin
  -- Drop named constraint from hardening migration
  if exists (
    select 1 from pg_constraint
    where conname = 'interval_valid'
      and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles drop constraint interval_valid;
  end if;

  -- Drop the original unnamed inline check (named vehicles_mileage_interval_check by Postgres)
  if exists (
    select 1 from pg_constraint
    where conname = 'vehicles_mileage_interval_check'
      and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles drop constraint vehicles_mileage_interval_check;
  end if;
end $$;

-- Add the widened constraint
alter table public.vehicles
  add constraint interval_valid
  check (mileage_interval in (5000, 7000, 9000, 10000));
