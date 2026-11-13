-- Rodar no SQL Editor do Supabase.
create table categories(id uuid primary key default gen_random_uuid(), name text not null unique check(char_length(name)<=80),
 description text default '', image text, sort_order int default 0, created_at timestamptz default now());
create table items(id uuid primary key default gen_random_uuid(), code text unique, name text not null check(char_length(name)<=120),
 description text default '', category_id uuid references categories(id) on delete restrict, main_image text,
 gallery jsonb default '[]', specs jsonb default '[]', price_cents integer not null default 0 check(price_cents >= 0),
 options jsonb default '[]', featured boolean default false,
 created_at timestamptz default now(), updated_at timestamptz default now());
create table admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table audit_log(id bigserial primary key, admin_id uuid, action text, entity text, entity_id text, created_at timestamptz default now());
alter table categories enable row level security; alter table items enable row level security;
alter table admins enable row level security; alter table audit_log enable row level security;
-- Público só lê. Escrita só pelo backend (service role ignora RLS). admins/audit_log sem policy = bloqueado.
create policy "read categories" on categories for select using (true);
create policy "read items" on items for select using (true);
-- Após criar o usuário em Authentication > Users:
-- insert into admins(user_id) values ('UUID-DO-USUARIO');
-- Storage: criar bucket "media" (leitura pública). Upload é feito pelo backend com service role; não crie policy pública de escrita.
