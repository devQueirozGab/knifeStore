import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
// Não derruba a função inteira quando falta variável: o servidor sobe e as rotas
// que dependem do banco respondem 503 em JSON (ver server/index.js).
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
if (!supabaseConfigured) console.error('[config] Variáveis do Supabase ausentes: defina SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.');
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const anon = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts) : null;
export const service = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts) : null; // só backend
