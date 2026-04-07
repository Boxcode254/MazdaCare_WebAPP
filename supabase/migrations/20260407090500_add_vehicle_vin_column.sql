alter table public.vehicles
add column if not exists vin text;

create index if not exists vehicles_vin_idx on public.vehicles (vin);
