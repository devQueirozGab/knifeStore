import crypto from 'node:crypto';
import { service } from './lib/supabase.js';
export const prod = process.env.NODE_ENV === 'production';
export const cookieOpts = { httpOnly: true, secure: prod, sameSite: 'strict', path: '/' };
export const newCsrf = () => crypto.randomBytes(24).toString('hex');
// CSRF double-submit + SameSite=Strict
export function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const c = req.cookies.csrf, h = req.get('x-csrf-token');
  if (!c || !h || c.length !== h.length || !crypto.timingSafeEqual(Buffer.from(c), Buffer.from(h))) return res.status(403).json({ error: 'Requisição inválida.' });
  next();
}
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies.sb_at; if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    const { data, error } = await service.auth.getUser(token); if (error || !data.user) return res.status(401).json({ error: 'Sessão expirada.' });
    const { data: adm } = await service.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (!adm) return res.status(403).json({ error: 'Sem permissão.' });
    req.admin = data.user; next();
  } catch { res.status(500).json({ error: 'Erro interno.' }); }
}
export const audit = (req, action, entity, entity_id) => service.from('audit_log').insert({ admin_id: req.admin.id, action, entity, entity_id: String(entity_id ?? '') });
