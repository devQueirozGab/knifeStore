import { Router } from 'express';
import { anon } from '../lib/supabase.js';
export const publicRouter = Router();
const fail = res => res.status(500).json({ error: 'Erro ao carregar dados.' });
publicRouter.get('/categories', async (_q, res) => {
  const { data, error } = await anon.from('categories').select('*').order('sort_order'); error ? fail(res) : res.json(data);
});
publicRouter.get('/items', async (_q, res) => {
  const { data, error } = await anon.from('items').select('*').order('created_at', { ascending: false }); error ? fail(res) : res.json(data);
});
publicRouter.get('/items/:id', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).json({ error: 'Não encontrado.' });
  const { data, error } = await anon.from('items').select('*, categories(name)').eq('id', req.params.id).maybeSingle();
  if (error) return fail(res); data ? res.json(data) : res.status(404).json({ error: 'Não encontrado.' });
});
