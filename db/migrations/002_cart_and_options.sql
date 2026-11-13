-- Execute este arquivo no SQL Editor do Supabase para projetos já criados.
alter table public.items add column if not exists price_cents integer not null default 0 check(price_cents >= 0);
alter table public.items add column if not exists options jsonb not null default '[]'::jsonb;
