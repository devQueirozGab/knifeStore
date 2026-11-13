import crypto from 'node:crypto';

const maxAge = 8 * 60 * 60 * 1000;
const safeCompare = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const settings = () => ({
  siteKey: process.env.CF_TURNSTILE_SITE_KEY || '',
  turnstileSecret: process.env.CF_TURNSTILE_SECRET || '',
  passSecret: process.env.ACCESS_GATE_SECRET || ''
});
const sign = (body, secret) => crypto.createHmac('sha256', secret).update(body).digest('base64url');
const createPass = secret => { const expires = Date.now() + maxAge; const body = String(expires); return `${body}.${sign(body, secret)}`; };

export const accessRouter = express => {
  const router = express.Router();
  router.get('/api/access/config', (_req, res) => {
    const { siteKey, turnstileSecret, passSecret } = settings();
    const enabled = Boolean(siteKey && turnstileSecret && passSecret);
    res.json({ enabled, siteKey: enabled ? siteKey : null });
  });
  router.post('/api/access/verify', async (req, res) => {
    const { siteKey, turnstileSecret, passSecret } = settings();
    const enabled = Boolean(siteKey && turnstileSecret && passSecret);
    if (!enabled) return res.status(503).json({ error: 'O portão Cloudflare ainda não foi configurado no servidor.' });
    const token = typeof req.body?.token === 'string' ? req.body.token.slice(0, 2048) : '';
    if (!token) return res.status(400).json({ error: 'Conclua a verificação para entrar.' });
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: turnstileSecret, response: token, remoteip: req.ip }) });
      const result = await response.json();
      if (!result.success || result.action !== 'site-entry') return res.status(403).json({ error: 'A verificação não foi aceita. Tente novamente.' });
      res.cookie('dt_access', createPass(passSecret), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
      res.json({ ok: true });
    } catch { res.status(503).json({ error: 'Não foi possível validar o acesso agora. Tente novamente.' }); }
  });
  return router;
};
