import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Variáveis de ambiente do Supabase ausentes (.env)');
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
export const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts); // só backend
