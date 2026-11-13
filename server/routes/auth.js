import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { anon, service } from '../lib/supabase.js';
import { cookieOpts, newCsrf, csrf, requireAdmin } from '../middleware.js';

export const authRouter = Router();
const limiter = rateLimit({
  windowMs: 15 * 60e3,
  limit: 5,
  // Atrás do Cloudflare, req.ip pode ser o IP da borda (compartilhado). Usa o IP real do visitante.
  keyGenerator: req => req.get('cf-connecting-ip') || req.ip,
  standardHeaders: true,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' }
});

authRouter.post('/login', limiter, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  try {
    // Primeiro valida as credenciais no Supabase Auth.
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data?.user || !data?.session?.access_token) {
      if (error) console.warn('[auth] Falha no Supabase Auth:', error.code || error.name || 'auth_error');
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // Depois verifica se o UUID do usuário está autorizado na tabela admins.
    const { data: admin, error: adminError } = await service
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (adminError) {
      // Não confundir erro de banco/configuração com senha incorreta.
      console.error('[auth] Falha ao consultar admins:', adminError.code || adminError.message || 'database_error');
      return res.status(503).json({ error: 'Não foi possível validar a permissão administrativa. Verifique a configuração do servidor.' });
    }

    if (!admin) {
      console.warn('[auth] Usuário autenticado sem registro administrativo.');
      return res.status(403).json({ error: 'Conta autenticada, mas sem permissão de administrador.' });
    }

    const maxAge = Math.min(Number(data.session.expires_in) || 3600, 3600) * 1000;
    res.cookie('sb_at', data.session.access_token, { ...cookieOpts, maxAge });
    res.cookie('csrf', newCsrf(), { ...cookieOpts, httpOnly: false, maxAge });
    return res.json({ ok: true });
  } catch (err) {
    // Nunca registrar senha, access token, refresh token ou conteúdo de cookies.
    console.error('[auth] Erro inesperado no login:', err?.message || 'unknown_error');
    return res.status(500).json({ error: 'Erro interno ao realizar login. Consulte o log do servidor.' });
  }
});

authRouter.post('/logout', csrf, (_q, res) => {
  res.clearCookie('sb_at', cookieOpts);
  res.clearCookie('csrf', { ...cookieOpts, httpOnly: false });
  res.json({ ok: true });
});

authRouter.get('/me', requireAdmin, (req, res) => res.json({ email: req.admin.email }));
