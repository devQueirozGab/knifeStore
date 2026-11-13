import { Router } from 'express';
import { imageExtension } from '../lib/image.js';
import express from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { service } from '../lib/supabase.js';
import { csrf, requireAdmin, audit } from '../middleware.js';
import { cleanItem, cleanCategory } from '../lib/validate.js';
export const adminRouter = Router();
adminRouter.use(requireAdmin, csrf);
const uuid = (req, res, next) => /^[0-9a-f-]{36}$/i.test(req.params.id) ? next() : res.status(400).json({ error: 'ID inválido.' });
const GENERIC = 'Não foi possível concluir a operação.';
// Protege o endpoint de upload contra abuso; o express.raw abaixo também limita cada arquivo a 8 MB.
const uploadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) {
  const detail = String(e?.message || '');
  if (/price_cents|\boptions\b/i.test(detail)) return res.status(503).json({ error: 'O banco ainda não recebeu a atualização de carrinho. Execute db/migrations/002_cart_and_options.sql no SQL Editor do Supabase e tente novamente.' });
  if (/bucket.*not found|bucket.*does not exist|bucket.*missing/i.test(detail)) return res.status(503).json({ error: 'O bucket de imagens "media" não existe no projeto Supabase atual. Execute db/storage.sql no SQL Editor desse mesmo projeto e tente novamente.' });
  if (/invalid api key|jwt|unauthorized|not authorized|permission denied/i.test(detail)) return res.status(503).json({ error: 'O Supabase recusou o acesso ao Storage. Confirme que SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY pertencem ao mesmo projeto e reinicie o servidor.' });
  res.status(400).json({ error: e.safe ? e.message : GENERIC });
} };
const ok = r => { if (r.error) throw new Error(r.error.message); return r.data; };
const safe = (fn, b) => { try { return fn(b); } catch (e) { e.safe = true; throw e; } };

adminRouter.get('/stats', wrap(async (_q, res) => {
  const [i, c, a, l] = await Promise.all([service.from('items').select('id', { count: 'exact', head: true }), service.from('categories').select('id', { count: 'exact', head: true }),
    service.from('items').select('id,name,created_at').order('created_at', { ascending: false }).limit(5), service.from('audit_log').select('*').order('created_at', { ascending: false }).limit(10)]);
  res.json({ items: i.count, categories: c.count, latest: a.data, activity: l.data });
}));

for (const [table, clean] of [['items', cleanItem], ['categories', cleanCategory]]) {
  adminRouter.post(`/${table}`, wrap(async (req, res) => { const d = ok(await service.from(table).insert(safe(clean, req.body)).select().single()); await audit(req, 'create', table, d.id); res.status(201).json(d); }));
  adminRouter.put(`/${table}/:id`, uuid, wrap(async (req, res) => { const d = ok(await service.from(table).update(safe(clean, req.body)).eq('id', req.params.id).select().single()); await audit(req, 'update', table, d.id); res.json(d); }));
}
adminRouter.delete('/items/:id', uuid, wrap(async (req, res) => { ok(await service.from('items').delete().eq('id', req.params.id).select()); await audit(req, 'delete', 'items', req.params.id); res.json({ ok: true }); }));
adminRouter.delete('/categories/:id', uuid, wrap(async (req, res) => {
  const { count, error } = await service.from('items').select('id', { count: 'exact', head: true }).eq('category_id', req.params.id);
  if (error) throw new Error(error.message);
  if (count > 0) return res.status(409).json({ error: `Esta categoria possui ${count} item(ns). Mova ou exclua os itens antes de excluí-la.` });
  ok(await service.from('categories').delete().eq('id', req.params.id).select()); await audit(req, 'delete', 'categories', req.params.id); res.json({ ok: true });
}));


// Upload autenticado para o bucket público "media". Valida a assinatura binária;
// SVG é recusado para evitar conteúdo ativo.
const imageBody = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], limit: '8mb' });
adminRouter.post('/media', uploadLimit, imageBody, wrap(async (req,res) => {
  const ext = imageExtension(req.body);
  if (!ext) return res.status(415).json({error:'Formato inválido. Envie JPG, PNG, WebP ou AVIF.'});
  const key = `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  const contentType = ({jpg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif'})[ext];
  const { error } = await service.storage.from('media').upload(key, req.body, { contentType, cacheControl:'31536000', upsert:false });
  if (error) throw new Error(error.message);
  const { data } = service.storage.from('media').getPublicUrl(key);
  await audit(req, 'upload', 'media', key);
  res.status(201).json({ path:key, url:data.publicUrl });
}));
