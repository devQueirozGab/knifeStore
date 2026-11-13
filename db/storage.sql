-- Execute no SQL Editor do mesmo projeto Supabase configurado no .env.
-- Cria o bucket público usado pelas imagens do catálogo.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- A escrita continua protegida: somente o backend usa a service role.
-- Não crie policy pública de INSERT, UPDATE ou DELETE para este bucket.
